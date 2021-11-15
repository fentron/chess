import Board from "../Board";

export default interface Bot {

    // looks at a board, as the colour whose turn it is to move, and returns a move the bot would like to make
    makeMove(board: Board):Promise<[number, number]>

}