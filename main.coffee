PIXEL_SIZE = 5
HEXAGON = [
  "        ****        ",
  "      **0110**      ",
  "    **00111100**    ",
  "  **000112211000**  ",
  "**0000112222110000**",
  "*000011223322110000*",
  "*000112233332211000*",
  "*001122334433221100*",
  "*011223344443322110*",
  "*112233445544332211*",
  "*112233445544332211*",
  "*011223344443322110*",
  "*001122334433221100*",
  "*000112233332211000*",
  "*000011223322110000*",
  "**0000112222110000**",
  "  **000112211000**  ",
  "    **00111100**    ",
  "      **0110**      ",
  "        ****        ",
]



Pixel = Backbone.Model.extend
  defaults:
    element: null
    x: null
    y: null
    size: null
    color: null
  initialize: ->
    x = parseInt(@get('x'))
    y = parseInt(@get('y'))
    size = @get('size')
    style = 'stroke-width:' + size + '; stroke:' + @get('color') + ';'
    pixel = @get('element').append('line')
      .attr('x1', x * size)
      .attr('y1', (y + 0.5) * size)
      .attr('x2', (x + 1) * size)
      .attr('y2', (y + 0.5) * size)
      .attr('style', style)
    return pixel

Hexagon = Backbone.Model.extend
  defaults:
    container: null
    coord: null
    color: null
    pixels: []
  initialize: ->
    colors = @get('color')
    width = 20 * PIXEL_SIZE
    height = 16 * PIXEL_SIZE
    [hex_x, hex_y] = @get('coord')
    hex_x = parseInt(hex_x)
    hex_y = parseInt(hex_y)
    offset_x = if hex_y % 2 then .5 else 0
    pos_x = width * (hex_x + offset_x)
    pos_y = height * hex_y
    cell = @get('container').append('svg:g')
    cell.attr('transform',  'translate(' +  pos_x + ', ' + pos_y + ')')
    for y, row of HEXAGON
      for x, dot of row
        if dot of colors
          @pixels = new Pixel
                      element: cell
                      x: x
                      y: y
                      size: PIXEL_SIZE
                      color: colors[dot]
    pixels = @get('pixels')
    pixels.push(cell)
    @set('pixels', pixels)

    @on("change:color", @colorChanged, @)
  colorChanged: ->
    console.log "color changed to " + @get('color')

Cell = Backbone.Model.extend
  defaults:
    element: null
    power: 0
    user_id: null
    location: null
  hasCell: ->
    return @.get('element') != null


RenderEngine =
  ###
  # board - Two dimentional array. Each item should be formatted as
  #         [<user_id>,<power>]
  ###
  user_colors:
    0:
      '*': '#7a7a7a'
      '0': '#888888'
      '1': '#949494'
      '2': '#a0a0a0'
      '3': '#acacac'
      '4': '#b8b8b8'
      '5': '#c4c4c4'
      '6': '#cfcfcf'
      '7': '#dbdbdb'
      '8': '#e7e7e7'
      '9': '#f3f3f3'
    1:
      '*': '#e60000'
      '0': '#ff6666'
      '1': '#ff8080'
      '2': '#ff9999'
      '3': '#ffb2b2'
      '4': '#ffcccc'
      '5': '#ffe6e6'
    2:
      '*': '#0000e6'
      '0': '#6666ff'
      '1': '#8080ff'
      '2': '#9999ff'
      '3': '#b2b2ff'
      '4': '#ccccff'
      '5': '#e6e6ff'

  board: null

  init: (board) ->
    svg = d3.select('body').append('svg')
        .attr('width', 500)
        .attr('height', 400)

    RenderEngine.board = []
    for y of board
      row = []
      for x of board[y]
        [user_id, power] = board[y][x]
        cell = new Cell
          element: new Hexagon
            container: svg
            coord: [x, y]
            color: RenderEngine.user_colors[user_id]
          power: power
          user_id: user_id
          location: [x, y]
        row.push(cell)
      RenderEngine.board.push(row)

  updateBoard: (board) ->
    return
    for y of board
      for x of board[y]
        [user_id, power] = board[y][x]
        #RenderEngine.board[y][x] =

board = [
  [[1, 50], [0, 10], [0, 10], [0, 10]],
  [[0, 10], [0, 10], [0, 10], [0, 10]],
  [[0, 10], [0, 10], [0, 10], [0, 10]],
  [[0, 10], [0, 10], [0, 10], [2, 50]],
]

RenderEngine.init(board)

step = 0
setInterval('tick()', 5000)
window.tick = ->
  step++
  if step == 1
    board[0][1] = [1, 27]
  #if step == 2
  RenderEngine.updateBoard(board)
