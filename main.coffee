RenderEngine =
  user_colors:
    0:
      '*': '#7a7a7a'
      '0': '#888888'
      '1': '#949494'
      '2': '#a0a0a0'
      '3': '#acacac'
      '4': '#b8b8b8'
      '5': '#c4c4c4'
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

  PIXEL_SIZE: 5

  HEXAGON: ["        ****        ",
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
            "        ****        ",]

  board: null

  Cell: Backbone.Model.extend
    defaults:
      container: null
      element: null
      power: 0
      user_id: null
      coord: null
      colors: null
    initialize: ->
      el_hexagon = new RenderEngine.Hexagon
        container: @get('container')
        coord: @get('coord')
        color: @get('colors')
      @set('element', el_hexagon)
      @on("change:user_id", @userChanged, @)
    userChanged: ->
      @get('element').set('color', @get('colors'))

  Hexagon: Backbone.Model.extend
    defaults:
      container: null
      coord: null
      color: null
      pixels: null
    initialize: ->
      colors = @get('color')
      width = 20 * RenderEngine.PIXEL_SIZE
      height = 16 * RenderEngine.PIXEL_SIZE
      [hex_x, hex_y] = @get('coord')
      hex_x = parseInt(hex_x)
      hex_y = parseInt(hex_y)
      offset_x = if hex_y % 2 then .5 else 0
      pos_x = width * (hex_x + offset_x)
      pos_y = height * hex_y
      cell = @get('container').append('svg:g')
      cell.attr('transform',  'translate(' +  pos_x + ', ' + pos_y + ')')
      pixels = []
      for y, row of RenderEngine.HEXAGON
        pixel_row = []
        for x, dot of row
          if dot of colors
            pixel = new RenderEngine.Pixel
              container: cell
              x: x
              y: y
              size: RenderEngine.PIXEL_SIZE
              color: colors[dot]
            pixel_row.push(pixel)
          else
            pixel_row.push(null)
        pixels.push(pixel_row)
      @set('pixels', pixels)
      @on("change:color", @colorChanged, @)
    colorChanged: ->
      colors = @get('color')
      pixels = @get('pixels')
      for y, row of RenderEngine.HEXAGON
        for x, dot of row
          if dot of colors
            pixels[y][x].set('color', colors[dot])

  Pixel: Backbone.Model.extend
    defaults:
      container: null
      element: null
      x: null
      y: null
      size: null
      color: null
    initialize: ->
      x = parseInt(@get('x'))
      y = parseInt(@get('y'))
      size = @get('size')
      pixel = @get('container').append('line')
        .attr('x1', x * size)
        .attr('y1', (y + 0.5) * size)
        .attr('x2', (x + 1) * size)
        .attr('y2', (y + 0.5) * size)
        .style('stroke-width', size)
        .style('stroke', @get('color'))
      @set('element', pixel)
      @on("change:color", @colorChanged, @)
    colorChanged: ->
      pixel = @get('element')
      pixel.transition().style('stroke', @get('color'))

  init: (board) ->
    svg = d3.select('body').append('svg')
        .attr('width', 500)
        .attr('height', 400)

    RenderEngine.board = []
    for y of board
      row = []
      for x of board[y]
        [user_id, power] = board[y][x]
        cell = new RenderEngine.Cell
          power: power
          user_id: user_id
          coord: [x, y]
          container: svg
          colors: RenderEngine.user_colors[user_id]
        row.push(cell)
      RenderEngine.board.push(row)

  updateBoard: (board) ->
    for y of board
      for x of board[y]
        [user_id, power] = board[y][x]
        cell = RenderEngine.board[y][x]
        if cell.get('user_id') != user_id
          cell.set('colors', RenderEngine.user_colors[user_id])
          cell.set('power', power)
          cell.set('user_id', user_id)
        else if cell.get('power') != power
          cell.set('power', power)


###
# board - Two dimentional array. Each item should be formatted as
#         [<user_id>,<power>]
###
board = [
  [[1, 50], [0, 10], [0, 10], [0, 10]],
  [[0, 10], [0, 10], [0, 10], [0, 10]],
  [[0, 10], [0, 10], [0, 10], [0, 10]],
  [[0, 10], [0, 10], [0, 10], [2, 50]],
]

RenderEngine.init(board)

step = 0
setInterval('tick()', 2000)
window.tick = ->
  step++
  if step == 1
    board[0][1] = [1, 27]
    board[2][3] = [2, 30]
  if step == 2
    board[0][2] = [1, 10]
  if step > 2
    board[0][1] = [0, 10]
    board[2][3] = [0, 10]
    board[0][2] = [0, 10]
    step = 0

  RenderEngine.updateBoard(board)

window.RE = RenderEngine  # TODO remove. debug only
