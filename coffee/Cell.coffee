Cell = Backbone.Model.extend
  defaults:
    neighbours: []
    power: 50
    color: "#cccccc"
    direction: 0

  initialize: ->
    el = new Graphics.Cell
      svg: @get('svg')
      color: @get('color')
      coord: _.clone(@get('coord'))
      power: @get('power')
      direction: @get('direction')
      parent: @
    @set('el', el)
    @on('change:power', @powerChanged, @)
    @on('change:color', @colorChanged, @)
    @on('change:direction', @directionChanged, @)

  dragstart: ->
    return unless @get('enabled')
    for direction, cell of @get('neighbours')
      cell.set('drag_src', [direction, @])
    Graphics.rollback_queue.push([
      ->
        for direction, cell of @get('neighbours')
          cell.set('drag_src', null)
      , @
    ])

  dragover: ->
    # {{{
    console.count('dragover')
    points = []
    appeared_els = []
    track_points = (move_dest)->
      coord = move_dest.get('el').get('coord')
      points.push([coord.x, coord.y])
      appeared_els.push(move_dest.cid)
    track_points(@)
    move_dest = @get('move_dest')
    num_loops = 0
    while move_dest? and move_dest.cid not in appeared_els
      track_points(move_dest)
      is_last = not move_dest.get('move_dest')
      fn = do (move_dest, is_last)->
        -> move_dest.get('el').highlight((if is_last then 30 else 0), 5000)
      #setTimeout(fn, ++num_loops * 35)
      setTimeout(fn, ++num_loops)
      move_dest = move_dest.get('move_dest')
      if move_dest and move_dest.cid in appeared_els
        track_points(move_dest)


    if points.length
      window.path.remove() if window.path
      svg = @get('el').get('svg')
      window.path = svg.insert("path", '#layer1')
        .data([points])
        .attr("d", d3.svg.line().interpolate("basis"))
        .attr('fill', 'none')
        .attr('stroke', '#aaa')
        .attr('stroke-width', 8)

      if Graphics.animate
        total_path_len = window.path.node().getTotalLength()
        translateAlong = (path)->
          return (d, i, a)->
            return (t)->
              p = path.getPointAtLength(t * total_path_len)
              return "translate(" + p.x + "," + p.y + ")"
        circle = svg.append("circle").attr("r", 3).attr("opacity", .2)
          .attr("transform", "translate(" + points[0] + ")")
        circle.transition()
          .duration(3.5 * total_path_len).ease('linear')
          .attrTween("transform", translateAlong(path.node()))
          .each('end', ->
            path.attr('visibility', 'hidden')
            circle.remove()
          )
    # }}}

    drag_src_info = @get('drag_src')
    return unless @get('enabled') or drag_src_info
    @get('el').animateHoverIn()
    if drag_src_info
      [direction, drag_src] = drag_src_info
      drag_src.get('el').tmpArrowTo(direction)

  dragout: ->
    drag_src_info = @get('drag_src')
    return unless @get('enabled') or drag_src_info
    @get('el').animateHoverOut()

  dragstop: ->
    drag_src_info = @get('drag_src')
    if drag_src_info
      @get('el').animateHoverOut()
      [direction, drag_src] = drag_src_info

      # {{{
      drag_src.set('move_dest', @)
      # }}}

      # triggers move action
      src_coord = drag_src.get('coord')
      dest_coord = @get('coord')
      args = [+src_coord.x, +src_coord.y, +dest_coord.x, +dest_coord.y]
      @get('renderengine').move.apply(@get('renderengine'), args)

  getNeighbourElements: ->
    (cell.get('el') for d, cell of @get('neighbours'))

  colorChanged: ->
    @get('el').set('color', @get('color'))

  powerChanged: ->
    @get('el').set('power', @get('power'))

  directionChanged: ->
    @get('el').set('direction', @get('direction'))
