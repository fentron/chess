import Board from "./Board.js";

export enum PieceTypes {
    Pawn = 'p',
    Knight = 'n',
    Castle = 'r',
    Bishop = 'b',
    Queen = 'q',
    King = 'k'
}

export enum Color {
    White,
    Black
}

export class Piece {
    piece: string;
    color: Color;
    element: HTMLElement;
    board: Board;
    position: string;
    _positionIndex: number;
    _rank: number; // 0 indexed rank(row) number
    _file: number; // 0 indexed file(column) number
    _legalMoveIndexes: number[];

    constructor(board: Board, piece: string, color: Color, position: number) {
        this.element = document.createElement('img');
        this.element.setAttribute('src', 'icons/' + piece + (color === Color.White ? '' : 'b') + '.svg');

        this.board = board;
        this.piece = piece;
        this.color = color;
        this.positionIndex = position;
    }

    set positionIndex(position: number) {
        this.position = this.board.posFromIndex(position);
        this._positionIndex = position;
        this._rank = Math.floor(position / 8);
        this._file = position % 8;
        this._legalMoveIndexes = null;
    }

    /**
     * Returns a list of indexes this piece can legally move to
     */
    getLegalMoveIndexes(): number[] {
        if (this._legalMoveIndexes !== null) {
            return this._legalMoveIndexes;
        }

        // the index offsets of the moves various pieces can make
        const kingMoves = [1, 9, 8, 7, -1, -7, -8, -9];
        const knightMoves = [17, 15, -15, -17, -10, -6, 10, 6];

        const castleSlides = [8, -8, 1, -1];
        const bishopSlides = [9, 7, -7, -9];

        let pieceMoves: number[] = [];
        let pieceSlides = [];

        let legalIndexes = [];

        // assign potential move offsets based on piece type, with special logic for pawns
        switch (this.piece.toLowerCase()) {
            case PieceTypes.King:
                pieceMoves = kingMoves;
                break;
            case PieceTypes.Knight:
                pieceMoves = knightMoves;
                break;
            case PieceTypes.Castle:
                pieceSlides = castleSlides;
                break;
            case PieceTypes.Queen:
                pieceMoves = kingMoves;
                pieceSlides = [...castleSlides, ...bishopSlides];
                break;
            case PieceTypes.Bishop:
                pieceSlides = bishopSlides;
                break;
            case PieceTypes.Pawn:
                let mul = this.color === Color.White ? -1 : 1;
                let pawnAttacks = [7 * mul, 9 * mul];

                if (!this.board.pieces[this._positionIndex + 8 * mul]) // if the position is empty
                    pieceMoves = [8 * mul];

                // double move if this is the first move
                if (
                    this._rank === (this.color === Color.White ? 6 : 1) && // correct rank(row)
                    !this.board.pieces[this._positionIndex + 16 * mul] && // and the position is empty
                    !this.board.pieces[this._positionIndex + 8 * mul] // and the previous position was empty (can't skip over)
                ) {
                    pieceMoves.push(16 * mul);
                }

                // can the pawn make a diagonal attack?
                for (let x = 0; x < pawnAttacks.length; x++) {
                    let i = this._positionIndex + pawnAttacks[x];
                    if (
                        this.isValidMoveIndex(i) &&
                        this.board.pieces[i] &&
                        this.board.pieces[i].color !== this.color
                    ) {
                        legalIndexes.push(i);
                    }
                }

                break;
        }

        // check each move index for validity
        for (let x = 0; x < pieceMoves.length; x++) {
            let i = this._positionIndex + pieceMoves[x];

            if (this.piece.toLowerCase() !== PieceTypes.Pawn && this.isValidMoveIndex(i))
                legalIndexes.push(i);
            else if(this.isValidMoveIndex(i) && !this.board.pieces[i])
                legalIndexes.push(i);
        }


        // slide along the sliding directions, checking for validity on each
        for (let x = 0; x < pieceSlides.length; x++) {
            let i = this._positionIndex + pieceSlides[x];

            while (this.isValidMoveIndex(i, (i - pieceSlides[x]) % 8)) {
                legalIndexes.push(i);
                if (this.board.pieces[i] && this.board.pieces[i].color !== this.color) { // if we've hit an allied piece
                    break;
                }
                i += pieceSlides[x];
            }
        }

        this._legalMoveIndexes = legalIndexes;

        return legalIndexes;
    }
    
    isValidMoveIndex(index, file = this._file): boolean {
        return !(
            (index >= 64 || index < 0) ||                                                   // this index is in bounds
            (Math.abs(index % 8 - file) > 2) ||                                          // it's not skipping over to an opposite file
            (this.board.pieces[index] && this.board.pieces[index].color === this.color) ||  // there's not an allied piece here
            (                                                                               // pawns can't capture except on the diagonal
                this.piece.toLowerCase() === PieceTypes.Pawn &&
                this.board.pieces[index] &&
                this.board.pieces[index].color !== this.color &&
                this.board.pieces[index]._file === this._file
            )
        );
    }

}