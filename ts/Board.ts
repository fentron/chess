import {Color, Piece, PieceTypes} from "./Piece.js";

type Pieces = Piece[]

// represents the standard opening state of a game in FEN standard notation
const openingFENString = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

class Board {
    pieces: Pieces;
    _attackedPieces: Pieces;
    _legalMoves: [number, number][] = [];
    whiteToMove: boolean;
    castling: string;
    halfmoveClock: number;
    fullMoveTimer: number;
    enPassantTarget: number;

    constructor(pieces: Pieces = null, FENString = openingFENString) {
        this.fullMoveTimer = 0;
        this.halfmoveClock = 0;
        this.enPassantTarget = null;

        if (pieces !== null)
            this.pieces = pieces;
        else {
            this.parseFENString(FENString || openingFENString);

        }

        this.calculateAttackedPieces();
    }

    get colorToMove(): Color {
        return (this.whiteToMove ? Color.White : Color.Black);
    }

    get nextToMove(): Color {
        return (this.whiteToMove ? Color.Black : Color.White);
    }

    /**
     * Takes a FEN notation screen and updates the board to match
     * @see https://en.wikipedia.org/wiki/Forsyth%E2%80%93Edwards_Notation
     * @param input FEN string
     */
    parseFENString(input: string) {
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

        // 4. en-passant (not supported)

        // 5. halfmove clock
        this.halfmoveClock = parseInt(parts[4]);

        // 6. fullmove number
        this.fullMoveTimer = parseInt(parts[5]);
    }

    /**
     * Outputs the current board as a FEN string
     */
    getFENstring(): string {
        let parts = [];

        // 1. pieces
        let ranks = [];
        for (let y = 0; y < 8; y++) {
            let rank = '';
            let emptyFileCount = 0;

            for (let x = 0; x < 8; x++) {
                if (this.pieces[y * 8 + x]) {
                    if (emptyFileCount) {
                        rank += emptyFileCount;
                    }

                    rank += this.pieces[y * 8 + x].piece;
                    emptyFileCount = 0;
                } else {
                    emptyFileCount++;
                }

                if (x === 7 && emptyFileCount) {
                    rank += emptyFileCount;
                }
            }

            ranks.push(rank);
        }
        parts.push(ranks.join('/'));

        // 2. color to move
        parts.push(this.whiteToMove ? 'w' : 'b');

        // 3. castling
        parts.push(this.castling);

        // 4. en-passant (not supported)
        parts.push('-');

        // 4. halfmove clock
        parts.push(this.halfmoveClock);

        // 5. fullmove timer
        parts.push(this.fullMoveTimer);

        return parts.join(' ');
    }

    makeMove(startI: number, finishI: number): boolean {
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

    boardAfterMove(startI, finishI): Board {
        let board = new Board([]);

        let pieces = [];

        // const startingFEN = this.getFENstring();

        for (let x = 0; x < 64; x++) {
            if (this.pieces[x]) {
                // copy all pieces to a new instance, to prevent context/pointer fuckery when we change the position
                board.pieces[x] = new Piece(board, this.pieces[x].piece, this.pieces[x].color, this.pieces[x]._positionIndex);
            }
        }
        board.pieces = this.pieces;

        board.calculateAttackedPieces();
        board.fullMoveTimer = this.fullMoveTimer;
        board.halfmoveClock = this.halfmoveClock;
        board.whiteToMove = this.whiteToMove;
        board.castling = this.castling;
        board.enPassantTarget = this.enPassantTarget;

        return board;
    }

    calculateAttackedPieces() {
        let attackedPieces: Pieces = [];

        for (let x = 0; x < 64; x++) {
            let piece = this.pieces[x];
            if (piece) {
                for (let y = 0; y < piece.getLegalMoveIndexes().length; y++) {
                    let i = piece.getLegalMoveIndexes()[y];
                    if (
                        this.pieces[i] && // there's a piece here
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

    isInCheck(color: Color): boolean {
        for (let x = 0; x < this._attackedPieces.length; x++) {
            if (
                this._attackedPieces[x].piece.toLowerCase() === PieceTypes.King &&
                this._attackedPieces[x].color !== color
            ) {
                return true;
            }
        }

        return false;
    }

    isInMate(): boolean {
        return !!!this.getAllLegalMoves().length;
    }

    canMakeMove(startI: number, finishI: number): boolean {
        const boardAfterMove = this.boardAfterMove(startI, finishI);

        return (
            this.pieces[startI] && // piece exists
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
                    if (
                        piece.color === this.colorToMove &&
                        this.canMakeMove(piece._positionIndex, i)
                    ) {
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
    posFromIndex(index: number): string {
        return 'abcdefgh'.charAt(index % 8) + (8 - (Math.floor(index / 8)));
    }
}

export default Board;
