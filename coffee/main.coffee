board = [
  [[1, 150, 3], [0, 90], [0, 10], [0, 10], [0, 10], [0, 10], ],
  [[0, 10], [0, 10], [0, 10], [0, 10], [0, 10], [0, 10], ],
  [[0, 10], [0, 10], [0, 10], [0, 10], [0, 10], [0, 10], ],
  [[0, 10], [0, 10], [0, 10], [0, 10], [0, 10], [0, 10], ],
  [[0, 10], [0, 10], [0, 10], [0, 10], [0, 10], [0, 10], ],
  [[0, 10], [0, 10], [0, 10], [0, 10], [0, 10], [2, 50, 1], ],
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
  board[0][1] = [1, 75, 3] if step == 1
  board[0][1] = [1, 30, 3] if step == 1
  if step == 2
    board[0][2] = [1, 50, 3]
    board[4][5] = [2, 70, 6]
  board[0][3] = [1, 20, 5] if step == 3
  board[4][4] = [2, 25, 6] if step == 4
  if step == 5
    board[1][2] = [1, 25, 4]
    board[4][3] = [2, 30, 2]
  game.updateBoard(board)

d3.selectAll('g').on('mouseover', ->
  el = d3.select(this)
  old_color = el.style('fill')
  d3.select(this).select('polygon').transition()
    .style('stroke-width', 3)
    .style('fill-opacity', .5)
)
d3.selectAll('g').on('mouseout', ->
  d3.select(this).select('polygon').transition()
    .style('stroke-width', 0)
    .style('fill-opacity', 1)
)
