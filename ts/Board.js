import { Color, Piece, PieceTypes } from "./Piece.js";
// represents the standard opening state of a game in FEN standard notation
const openingFENString = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
class Board {
    constructor(pieces = null, FENString = openingFENString) {
        this._legalMoves = [];
        if (pieces !== null)
            this.pieces = pieces;
        else
            this.parseFENString(FENString || openingFENString);
        this.fullMoveTimer = 0;
        this.halfmoveClock = 0;
        this.enPassantTarget = null;
        this.calculateAttackedPieces();
    }
    get colorToMove() {
        return (this.whiteToMove ? Color.White : Color.Black);
    }
    get nextToMove() {
        return (this.whiteToMove ? Color.Black : Color.White);
    }
    /**
     * Takes a FEN notation screen and updates the board to match
     * @see https://en.wikipedia.org/wiki/Forsyth%E2%80%93Edwards_Notation
     * @param input FEN string
     */
    parseFENString(input) {
        this.pieces = [];
        let parts = input.split(' ');
        if (!parts) {
            return false;
        }
        // 1. piece placement
        const ranks = parts[0].split('/');
        if (ranks.length !== 8) {
            return false;
        }
        ranks.forEach((rank, rankIndex) => {
            let file = 0;
            rank.split('').forEach(char => {
                if (!isNaN(parseInt(char))) {
                    file += parseInt(char);
                    return;
                }
                let color = char.charCodeAt(0) >= 65 && char.charCodeAt(0) <= 90 ? Color.White : Color.Black;
                let position = rankIndex * 8 + file;
                this.pieces[position] = new Piece(this, char, color, position);
                file++;
            });
        });
        // 2. active color
        this.whiteToMove = parts[1] === 'w';
        // 3. castling
        this.castling = parts[2];
        // 4. halfmove clock
        // 5. fullmove number
    }
    makeMove(startI, finishI) {
        const piece = this.pieces[startI];
        delete this.pieces[finishI];
        delete this.pieces[startI];
        this.pieces[finishI] = piece;
        this.pieces[finishI].positionIndex = finishI;
        if (!this.whiteToMove)
            this.fullMoveTimer++;
        this.whiteToMove = !this.whiteToMove;
        // clear the legal move indexes since we don't know what's legal anymore
        for (let x = 0; x < 64; x++) {
            if (this.pieces[x]) {
                this.pieces[x]._legalMoveIndexes = null;
            }
        }
        this._legalMoves = null;
        this.calculateAttackedPieces();
        return true;
    }
    boardAfterMove(startI, finishI) {
        let board = new Board([]);
        let pieces = [];
        for (let x = 0; x < 64; x++) {
            if (this.pieces[x]) {
                // copy all pieces to a new instance, to prevent context/pointer fuckery when we change the position
                board.pieces[x] = new Piece(board, this.pieces[x].piece, this.pieces[x].color, this.pieces[x]._positionIndex);
            }
        }
        board.calculateAttackedPieces();
        board.fullMoveTimer = this.fullMoveTimer;
        board.halfmoveClock = this.halfmoveClock;
        board.whiteToMove = this.whiteToMove;
        board.castling = this.castling;
        board.enPassantTarget = this.enPassantTarget;
        board.makeMove(startI, finishI);
        return board;
    }
    calculateAttackedPieces() {
        let attackedPieces = [];
        for (let x = 0; x < 64; x++) {
            let piece = this.pieces[x];
            if (piece) {
                for (let y = 0; y < piece.getLegalMoveIndexes().length; y++) {
                    let i = piece.getLegalMoveIndexes()[y];
                    if (this.pieces[i] && // there's a piece here
                        this.pieces[i].color !== piece.color && // attacked by an enemy
                        (this.pieces[i].piece.toLowerCase() !== PieceTypes.Pawn) // that isn't a pawn
                    ) {
                        attackedPieces.push(this.pieces[i]);
                    }
                }
            }
        }
        this._attackedPieces = attackedPieces;
    }
    isInCheck(color) {
        for (let x = 0; x < this._attackedPieces.length; x++) {
            if (this._attackedPieces[x].piece.toLowerCase() === PieceTypes.King &&
                this._attackedPieces[x].color !== color) {
                return true;
            }
        }
        return false;
    }
    isInMate() {
        return !!!this.getAllLegalMoves().length;
    }
    canMakeMove(startI, finishI) {
        const boardAfterMove = this.boardAfterMove(startI, finishI);
        return (this.pieces[startI] && // piece exists
            this.pieces[startI].color === this.colorToMove && // correct color to move
            this.pieces[startI].getLegalMoveIndexes().includes(finishI) && // legal move for this piece
            !boardAfterMove.isInCheck(boardAfterMove.colorToMove) // not a move that will put us in check
        );
    }
    getAllLegalMoves() {
        if (this._legalMoves !== null) {
            return this._legalMoves;
        }
        let legalMoves = [];
        for (let x = 0; x < 64; x++) {
            let piece = this.pieces[x];
            if (piece) {
                for (let y = 0; y < piece.getLegalMoveIndexes().length; y++) {
                    let i = piece.getLegalMoveIndexes()[y];
                    if (piece.color === this.colorToMove &&
                        this.canMakeMove(piece._positionIndex, i)) {
                        legalMoves.push([piece._positionIndex, i]);
                    }
                }
            }
        }
        this._legalMoves = legalMoves;
        return legalMoves;
    }
    /**
     * FileRank from index 0-64
     * @param index
     */
    posFromIndex(index) {
        return 'abcdefgh'.charAt(index % 8) + (8 - (Math.floor(index / 8)));
    }
}
export default Board;
//# sourceMappingURL=Board.js.map