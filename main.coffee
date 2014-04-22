svg = d3.select('body')
  .append('svg')
    .attr('width', 400)
    .attr('height', 400)

PIXEL_SIZE = 3

pixel_at = (container, x, y, color) ->
  x = parseInt(x)
  y = parseInt(y)
  container.append('line')
    .attr('x1', x * PIXEL_SIZE)
    .attr('y1', (y + 0.5) * PIXEL_SIZE)
    .attr('x2', (x + 1) * PIXEL_SIZE)
    .attr('y2', (y + 0.5) * PIXEL_SIZE)
    .attr('style', 'stroke-width:' + PIXEL_SIZE + '; stroke:' + color)

hexagon = (board_el, coord) ->
  stroke = '#ff0000'
  fill = '#ff9999'
  map = [
    "        ****        ",
    "      **0000**      ",
    "    **00000000**    ",
    "  **0000     000**  ",
    "**0000000000000000**",
    "*000000000000000000*",
    "*000000000000000000*",
    "*000000000000000000*",
    "*000000000000000000*",
    "*000000000000000000*",
    "*000000000000000000*",
    "*000000000000000000*",
    "*000000000000000000*",
    "*000000000000000000*",
    "*000000000000000000*",
    "**0000000000000000**",
    "  **000000000000**  ",
    "    **00000000**    ",
    "      **0000**      ",
    "        ****        ",
  ]
  width = 20 * PIXEL_SIZE
  height = 16 * PIXEL_SIZE
  [hex_x, hex_y] = coord
  hex_x = parseInt(hex_x)
  hex_y = parseInt(hex_y)
  offset_x = if hex_y % 2 then .5 else 0
  pos_x = width * (hex_x + offset_x)
  pos_y = height * hex_y
  cell = board_el.append('svg:g').attr('transform',  'translate(' +  pos_x + ', ' + pos_y + ')')
  for y, row of map
    for x, dot of row
      if dot != " "
        pixel_at(cell, x, y, if dot == "0" then fill else stroke)
  return cell

Cell = Backbone.Model.extend(
  defaults:
    element: null
    power: 0
    user_id: null
    location: null
  hasCell: ->
    return @.get('element') != null
  )

board = [
  [1, 0, 0, 0],
  [0, 0, 0, 0],
  [0, 0, 0, 0],
  [0, 0, 0, 2],
]

for y of board
  for x of board[y]
    board[y][x] = new Cell(
      element: hexagon(svg, [x, y])
      power: 10
      user_id: board[y][x]
      location: [x, y]
    )

console.log "hello!"


a = new Hexagon(1, 3)


cell = {
  element: new Hexagon(1, 3, "#f00")
  power: 10
  user_id: user1.id
  color: "#f00"
  location: [1, 3]
}

cell.attack("right-bottom")
