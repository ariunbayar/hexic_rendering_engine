class RenderEngine
  colors:
    red: "#F72700"
    blue: "#447786"
    gray: "#C8C8C8"

  constructor: (container_id, width, height, user_id) ->
    @board = []
    @svg = Graphics.createSVG(container_id, width, height)
    @user_id = user_id

  updateBoard: (board_users, board_powers, board_moves) ->
    # board_users  : [[<user_id>, <user_id> ...], ...]
    # board_powers : [[<power>, <power> ...], ...]
    # board_moves  : [[<from_x>, <from_y>, <to_x>, <to_y>], ...]
    # TODO optimize directions
    directions = {}
    for y of board_users
      @board[y] = [] if not (y of @board)
      for x of board_users[y]
        user_id = board_users[y][x]
        power = board_powers[y][x]
        color = @_getColor(user_id)

        @board[y][x] = @_newCellAt(x, y, color) if not (x of @board[y])

        @board[y][x].set('color', color)
        @board[y][x].set('power', power)
        @board[y][x].set('enabled', user_id == @user_id)
        d = @board[y][x].get('direction')
        directions["#{y}_#{x}"] = d if d

    # set directions
    for [fx, fy, tx, ty] in board_moves
      direction = @_getDirection(fx, fy, tx, ty)
      if direction
        @board[fy][fx].set('direction', direction)
        delete directions["#{fy}_#{fx}"]
    for pos of directions
      [y, x] = pos.split('_')
      @board[y][x].set('direction', 0)

    # set its neighbours
    has_cell_at = (y, x) ->
      if y of board_users
        return x of board_users[y]
      return false
    for y of board_users
      for x of board_users[y]
        y = parseInt(y)
        x = parseInt(x)
        shift = if y % 2 then 0 else 1
        neighbours = []
        neighbours[1] = @board[y-1][x-1+shift]  if has_cell_at(y-1, x-1+shift)
        neighbours[2] = @board[y-1][x+shift]    if has_cell_at(y-1, x+shift)
        neighbours[3] = @board[y][x+1]          if has_cell_at(y, x+1)
        neighbours[4] = @board[y+1][x+shift]    if has_cell_at(y+1, x+shift)
        neighbours[5] = @board[y+1][x-1+shift]  if has_cell_at(y+1, x-1+shift)
        neighbours[6] = @board[y][x-1]          if has_cell_at(y, x-1)
        @board[y][x].set('neighbours', neighbours)
    return

  _getDirection: (fx, fy, tx, ty) ->
    shift = if fy % 2 then 0 else 1
    return 1 if ty == fy - 1 and tx == fx - 1 + shift
    return 2 if ty == fy - 1 and tx == fx + shift
    return 3 if ty == fy     and tx == fx + 1
    return 4 if ty == fy + 1 and tx == fx + shift
    return 5 if ty == fy + 1 and tx == fx - 1 + shift
    return 6 if ty == fy     and tx == fx - 1
    return 0

  _newCellAt: (x, y, color) ->
    new Cell
      svg: @svg
      color: color
      coord: {x: x, y: y}
      renderengine: @

  _getColor: (user_id) ->
    if not ('_colors_assigned' of @)
      @_colors_assigned = {}
      @_colors_left = [@colors.blue, @colors.red]
    if user_id == 0
      return @colors.gray
    if user_id of @_colors_assigned
      return @_colors_assigned[user_id]
    if @_colors_left.length
      return @_colors_assigned[user_id] = @_colors_left.shift()
    num_users = ((i for i of @_colors_assigned).length + 1)
    throw new Error "not enough colors for #{num_users} users"

  move: (fx, fy, tx, ty) ->
    console.log(fx, fy, tx, ty, @)


# expose the render engine
@Engine = RenderEngine
