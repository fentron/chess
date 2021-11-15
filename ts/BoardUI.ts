import Board from "./Board.js";
import {Color, Piece} from "./Piece.js";
import AudioPlayer from "./AudioPlayer.js";
import Bot from "./bots/Bot.js";
import BigInter from "./bots/BigInter.js";

export default class BoardUI {
    board: Board;
    cells: HTMLElement[];
    el: HTMLElement;
    audio: AudioPlayer;
    bot: Bot;
    currentMousePosition: number; // i of the grid the mouse is currently over
    _draggedPiece: Piece;

    constructor(el: HTMLElement) {
        this.board = new Board();
        this.audio = new AudioPlayer();
        this.bot = new BigInter();
        this.el = el;

        // construct cells
        this.cells = [];
        for (let i = 0; i < 64; i++) {
            let el = document.createElement('div');
            el.classList.add('cell');
            el.innerHTML = '<span class="pos-indicator">' + this.board.posFromIndex(i) + '/' + i.toString() + '</span>';

            if (this.board.pieces[i]) {
                el.append(this.board.pieces[i].element);
            }

            this.cells.push(el);
        }

        this.el.append(...this.cells);

        // @ts-ignore
        window.board = this.board;
        // @ts-ignore
        window.pieces = this.board.pieces;
        // @ts-ignore
        this.el.boardRef = this;

        this.addEvents();
    }

    set draggedPiece(piece: Piece) {
        if (this._draggedPiece) {
            this._draggedPiece.element.classList.remove('dragged');
            this._draggedPiece.element.style.left = null;
            this._draggedPiece.element.style.top = null;
        }
        this._draggedPiece = piece;

        this.clearHighlights();

        if (piece) {
            this.highlightMoves(piece);
            this._draggedPiece.element.classList.add('dragged');
        }
    }

    get draggedPiece() {
        return this._draggedPiece;
    }

    addEvents() {
        this.cells.forEach((cell, i) => {
            cell.onclick = () => this.onCellClick(i);
            cell.onmousedown = (e) => this.onCellMouseDown(i, e);
        });

        this.el.onmousemove = (e) => {
            window.requestAnimationFrame(() => {
                const x = (e.pageX - this.el.offsetLeft) / this.el.clientWidth;
                const y = (e.pageY - this.el.offsetTop) / this.el.clientHeight;
                this.currentMousePosition = Math.floor(x * 8) + (8 * Math.floor(y * 8));

                if (this.draggedPiece) {
                    this.draggedPiece.element.style.left = e.screenX + 'px';
                    this.draggedPiece.element.style.top = e.screenY - 120 + 'px';
                }
            });
        };

        this.el.onmouseleave = () => this.draggedPiece = null;
    }

    onCellMouseDown(i, e) {
        if (e.button === 2) {
            this.draggedPiece = null;
            e.preventDefault();
            return;
        }

        if (!this.board.pieces[i] || e.button !== 0)
            return;

        const piece = this.board.pieces[this.currentMousePosition];

        if (piece && piece.color === Color.White) {
            this.draggedPiece = piece;
            this.draggedPiece.element.style.left = e.screenX + 'px';
            this.draggedPiece.element.style.top = e.screenY - 120 + 'px';
        }
        this.el.addEventListener('mouseup', this.onDragMouseUp, {
            passive: true
        });
    }

    onDragMouseUp() {
        // @ts-ignore
        this.boardRef.attemptMove(this.boardRef.currentMousePosition);
        // @ts-ignore
        this.boardRef.draggedPiece = null;
        // @ts-ignore
        this.boardRef.el.removeEventListener('mouseup', this.boardRef.onDragMouseUp);
    }

    onCellClick(i) {
        // if (!this.board.pieces[i])
        //     return;
        //
        // const piece = this.board.pieces[i];
        //
        // this.highlightMoves(piece);
    }

    clearHighlights() {
        this.query('.highlight')?.forEach(el => el.classList.remove('highlight'));
        this.query('.highlight-attack')?.forEach(el => el.classList.remove('highlight-attack'));
    }

    highlightMoves(piece: Piece) {
        this.clearHighlights();

        piece.getLegalMoveIndexes().forEach(i => {
            if (this.board.pieces[i] && this.board.pieces[i].color === Color.Black) {
                this.cells[i].classList.add('highlight-attack');
            } else {
                this.cells[i].classList.add('highlight');
            }
        });
    }

    async makeMove(startI, endI) {
        console.log(`Making move ${startI} - ${endI}`);
        this.board.pieces[endI]?.element.remove();

        this.board.makeMove(startI, endI);

        if (this.board.isInMate()) {
            this.audio.playMate();
        } else if (this.board.isInCheck(this.board.nextToMove)) {
            this.audio.playCheck();
        } else if (
            this.board.pieces[startI] && this.board.pieces[endI] &&
            this.board.pieces[endI].color !== this.board.pieces[startI].color
        ) {
            this.audio.playTakes();
        } else {
            this.audio.playMove();
        }
    }

    async attemptMove(endI) {
        if (this.draggedPiece) {
            const startI = this.draggedPiece._positionIndex;
            const draggedPiece = this.draggedPiece;

            let before = performance.now();

            if (this.board.canMakeMove(startI, endI)) {

                await this.makeMove(startI, endI);

                if (this.board.isInMate()) {
                    console.log(`Checkmate. ${this.board.whiteToMove ? 'Black' : 'White'} wins`);
                }

                draggedPiece.element.remove();
                this.cells[endI]?.append(draggedPiece.element);
                this.query('.highlight')?.forEach(el => el.classList.remove('highlight'));

                const move = await this.bot.makeMove(this.board);
                await this.makeMove(...move);
            } else {
                console.log(`Can't make move ${startI} - ${endI}`);

                if (this.draggedPiece.color !== this.board.colorToMove) {
                    console.log('not your move dumdum');
                }
            }

            let after = performance.now();
            console.log(`attemptMove took ${after-before}ms`);
        }
    }

    query(q) {
        return this.el.querySelectorAll(q);
    }
}