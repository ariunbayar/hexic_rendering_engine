board = [
  [[1, 50], [0, 90], [0, 10], [0, 10], [0, 10], [0, 10], ],
  [[0, 10], [0, 10], [0, 10], [0, 10], [0, 10], [0, 10], ],
  [[0, 10], [0, 10], [0, 10], [0, 10], [0, 10], [0, 10], ],
  [[0, 10], [0, 10], [0, 10], [0, 10], [0, 10], [0, 10], ],
  [[0, 10], [0, 10], [0, 10], [0, 10], [0, 10], [0, 10], ],
  [[0, 10], [0, 10], [0, 10], [0, 10], [0, 10], [2, 50], ],
]

window.game = new Engine

step = 0

timer = setInterval('ticker()', 3000)
game.updateBoard(board)

increment_cells = (board) ->
  for y of board
    for x of board[y]
      board[y][x][1] += 3

window.ticker = ->
  step++
  increment_cells(board)
  board[0][1] = [1, 75] if step == 1
  board[0][1] = [1, 30] if step == 1
  if step == 2
    board[0][2] = [1, 50]
    board[4][5] = [2, 70]
  board[0][3] = [1, 20] if step == 3
  board[4][4] = [2, 25] if step == 4
  if step == 5
    board[1][2] = [1, 25]
    board[4][3] = [2, 30]
  game.updateBoard(board)
