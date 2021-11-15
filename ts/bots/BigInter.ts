import Bot from "./Bot";
import Board from "../Board";

/**
 * Chooses a random legal moves
 */
export default class BigInter implements Bot {
    async makeMove(board: Board): Promise<[number, number]> {
        return board.getAllLegalMoves()[Math.floor(Math.random() * board.getAllLegalMoves().length)];
    }
}