Graphics =
  board_offset: {x: 30, y: 30}

  animate: false
  touch_detected: false
  mouse_detected: false
  rollback_queue: []

  rollbackActions: ->
    while item = @rollback_queue.shift()
      [func, context, args] = item
      if args
        func.apply(context, args)
      else
        func.call(context)

  createSVG: (container_selector, width, height) ->
    svg = d3.select(container_selector).append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('style', '-webkit-user-select: none; -moz-user-select: none; -ms-user-select: none; -o-user-select: none; user-select: none;')
    svg.on('touchstart', ->
      svg.on('mousemove', null)
      svg.on('touchstart', null)
      Graphics.touch_detected = true
    ).on('mousemove', ->
      svg.on('mousemove', null)
      svg.on('touchstart', null)
      Graphics.mouse_detected = true
    ).on('contextmenu', ->
      d3.event.preventDefault()
    )
    # TODO make sure following events run for each client
    self = @
    window.addEventListener('blur', -> self.rollbackActions.call(self))
    window.addEventListener('mouseup', -> self.rollbackActions.call(self))
    window.addEventListener('touchmove', (e)-> e.preventDefault())
    svg.append('g').attr('id', 'layer1')
    svg.append('g').attr('id', 'layer2')
    return svg

  Cell: Backbone.Model.extend({
    initialize: ->
      # required attrs: svg, color, coord
      @initCoord()
      @initContainer()
      @initCircle()
      @initArc()
      @initHexagon()
      @initArrow()
      @initText()
      @initTmpArrow()
      @on('change:power', @changedPower, @)
      @on('change:color', @changedColor, @)
      @on('change:direction', @changedDirection, @)

    initCoord: ->
      coord = @get('coord')
      sin_60 = Math.sin(Math.PI / 3)
      offset_x = 2 * 30 * sin_60
      offset_y = 2 * 30 * sin_60 * sin_60
      shift_x = if coord.y % 2 then 0 else offset_x / 2
      coord.x = coord.x * offset_x + Graphics.board_offset.x + shift_x
      coord.y = coord.y * offset_y + Graphics.board_offset.y
      @set('coord', coord)

    initContainer: ->
      container = @get('svg').select('#layer1').append('g')
      coord = @get('coord')
      container.attr('transform', "translate(#{coord.x}, #{coord.y})")
      @set('container', container)

    initCircle: ->
      [radius, angle] = @_getRadiusAndAngle()
      container = @get('container')
      color = @get('color')

      circle = container.append('circle')
        .attr('r', radius)
        .attr('fill', color)
      @set('circle', circle)

    initArc: ->
      [radius, angle] = @_getRadiusAndAngle()
      container = @get('container')
      color = @get('color')

      d = d3.svg.arc()
        .startAngle(0)
        .innerRadius(radius)
        .outerRadius(radius + 3)
        .endAngle(angle)
      arc = container.append('path')
        .attr('opacity', .5)
        .attr('fill', color)
        .attr('stroke', color)
        .attr('stroke-width', 2)
        .attr('stroke-linejoin', 'round')
        .attr('d', d)
      @set('arc', arc)

    initText: ->
      container = @get('container')
      color = @get('color')
      text = container.append('text')
        .attr("x", 0)
        .attr("y", 0)
        .attr("text-anchor", 'middle')
        .attr("alignment-baseline", 'central')
        .attr("font-family", "Pathway Gothic One, sans-serif")
        .attr("font-size", ".8em")
        .attr("font-weight", 400)
        .attr("fill", "white")
        .attr("stroke-width", .5)
      @set('text', text)
      #@get('text').attr('visibility', 'hidden')

      #@get('arc').attr('opacity', 1)
      @get('arc').attr('visibility', 'hidden')
      @get('circle').attr('visibility', 'hidden')

      self = @
      text.on('mousedown',  -> self.mouseDown.call(self))
      text.on('mouseup',    -> self.mouseUp.call(self))
      text.on('mouseover',  -> self.mouseOver.call(self))
      text.on('mouseout',   -> self.mouseOut.call(self))
      text.on('touchstart', -> self.touchStart.call(self))
      text.on('touchmove',  -> self.touchMove.call(self))
      text.on('touchend',   -> self.touchEnd.call(self))

    initHexagon: ->
      container = @get('container')
      color = @get('color')

      points = ""
      angle = Math.PI / 3
      for i in [0...6]
        currX = Math.cos(i * angle + angle/2) * 18
        currY = Math.sin(i * angle + angle/2) * 18
        points += (i and "," or "") + currX + "," + currY

      hexagon = container.append("svg:polygon")
        .attr('fill', color)
        .attr('stroke', color)
        .attr('stroke-width', 18)
        .attr('opacity', .6)
        #.attr('opacity', 1)
        .attr('points', points)
        .style('stroke-linejoin', 'round')
      @set('hexagon', hexagon)

      self = @
      hexagon.on('mousedown',  -> self.mouseDown.call(self))
      hexagon.on('mouseup',    -> self.mouseUp.call(self))
      hexagon.on('mouseover',  -> self.mouseOver.call(self))
      hexagon.on('mouseout',   -> self.mouseOut.call(self))
      hexagon.on('touchstart', -> self.touchStart.call(self))
      hexagon.on('touchmove',  -> self.touchMove.call(self))
      hexagon.on('touchend',   -> self.touchEnd.call(self))

    initArrow: ->
      container = @get('svg').select('#layer2').append('g')
      color = @get('color')

      #arrow = container.append("svg:polygon")
        #.attr('stroke', color)
        #.attr('stroke-width', 5)
        #.attr("points", "0,-5 5,0 -5,0 0,-5")
        ##.attr("points", "0,8 5,13 0,13 -5,13 0,8")
        #.attr('stroke-linejoin', 'round')
        #.attr('visibility', 'hidden')
      arrow = container.append('svg:path')
        .attr('fill', color)
        .attr('d', "m 0,-6.31 a 1.31,1.31 0 0 0 -0.90,0.38 l -3.69,3.69 a 1.31,1.31 0 0 0 0.92,2.22 l 7.39,0 a 1.31,1.31 0 0 0 0.92,-2.21 l -3.69,-3.69 a 1.31,1.31 0 0 0 -0.94,-0.38 z")
        .attr('visibility', 'hidden')
      @set('arrow', arrow)
      if @get('direction')
        @changedDirection()

      self = @
      arrow.on('mousedown',  -> self.mouseDown.call(self))
      arrow.on('mouseup',    -> self.mouseUp.call(self))
      arrow.on('mouseover',  -> self.mouseOver.call(self))
      arrow.on('mouseout',   -> self.mouseOut.call(self))
      arrow.on('touchstart', -> self.touchStart.call(self))
      arrow.on('touchmove',  -> self.touchMove.call(self))
      arrow.on('touchend',   -> self.touchEnd.call(self))

    initTmpArrow: ->
      svg = @get('svg')
      return if svg.tmp_arrow
      arrow = svg.append("svg:polygon")
        .attr('stroke', '#ffff00')
        .attr('stroke-width', 5)
        .attr("points", "0,0 10,10 0,5 -10,10 0,0")
        .attr('stroke-linejoin', 'round')
        .attr('visibility', 'hidden')
      svg.tmp_arrow = arrow

    _powerToRadiusAndAngle: (power) ->
      angle = 0
      p = power
      max_radius = 21
      for radius in [3..max_radius] by 3
        perimeter = radius * 2 * Math.PI
        if p > perimeter
          if radius >= max_radius
            break
            #throw new Error("maximum power exceeded for #{power}")
          p -= perimeter
        else
          angle = 2 * Math.PI * p / perimeter
          break
      return [radius, angle]

    _getRadiusAndAngle: ->
      power = @get('power')
      fn = @_powerToRadiusAndAngle
      angle = Cache.call("angle_for_#{power}", fn, @, power)

    _blendColors: (fg_color, fg_opacity, bg_color)->
      fg = d3.rgb(fg_color)
      bg = d3.rgb(bg_color)

      return d3.rgb(
          Math.round(fg.r * fg_opacity + bg.r * (1 - fg_opacity)),
          Math.round(fg.g * fg_opacity + bg.g * (1 - fg_opacity)),
          Math.round(fg.b * fg_opacity + bg.b * (1 - fg_opacity))
      )

    changedPower: ->
      [radius, angle] = @_getRadiusAndAngle()
      d = d3.svg.arc()
        .startAngle(0)
        .innerRadius(radius)
        .outerRadius(radius + 3)
        .endAngle(angle)
      @get('arc').attr('d', d)
      @get('circle').attr('r', radius)

      power = @get('power')

      #@get('hexagon').attr('opacity', (Math.min(power / 100, .5) + .5))

      formatted_power = if power > 1000 then ~~(power / 100) / 10 + 'k' else power
      @get('text').text(formatted_power)

    changedColor: ->
      color = @get('color')
      @get('circle')
        .attr('fill', color)
      @get('arc')
        .attr('stroke', color)
        .attr('fill', color)
      @get('hexagon')
        .attr('stroke', color)
        .attr('fill', color)
      @get('arrow')
        #.attr('fill', color)
        #.attr('fill', '#fff').attr('opacity', .5)
        #.attr('fill', @_blendColors(color, @get('hexagon').attr('opacity'), '#fdf6e3'))
        .attr('fill', @_blendColors(color, .8, '#fdf6e3'))

      return unless Graphics.animate
      container = @get('container')
      t = container.attr('transform')
      container
        .attr('transform', t + ' scale(0.5, 0.5)')
        .transition()
        .attr('transform', t)

    _transformArrow: (arrow, d, offset) ->
      d = parseInt(d)
      direction = d == 1 and 6 or d - 1
      arrow.style('visibility', direction > 0 and 'visible' or 'hidden')
      return unless direction > 0
      t = d3.transform()
      t.rotate = direction * 60 - 30
      coord_x = Math.cos((direction - 2) * Math.PI / 3) * 30
      coord_y = Math.sin((direction - 2) * Math.PI / 3) * 30
      if offset
        t.translate = [coord_x + offset.x, coord_y + offset.y]
      else
        t.translate = [coord_x, coord_y]
      arrow.attr('transform', t.toString())

    changedDirection: ->
      @_transformArrow(@get('arrow'), @get('direction'), @get('coord'))

    tmpArrowTo: (d) ->
      svg = @get('svg')
      return unless svg.tmp_arrow
      @_transformArrow(svg.tmp_arrow, d, @get('coord'))

    mouseDown: ->
      return if Graphics.touch_detected
      Graphics.rollbackActions()
      @get('parent').dragstart.call(@get('parent'))

    mouseUp: ->
      return if Graphics.touch_detected
      @get('parent').dragstop.call(@get('parent'))
      Graphics.rollbackActions()

    mouseOver: ->
      return if Graphics.touch_detected
      @get('parent').dragover.call(@get('parent'))

    mouseOut: ->
      return if Graphics.touch_detected
      @tmpArrowTo(0)
      @get('parent').dragout.call(@get('parent'))

    touchStart: ->
      return if Graphics.mouse_detected
      Graphics.rollbackActions()
      @get('parent').dragstart()

    touchMove: ->
      return if Graphics.mouse_detected
      [x, y] = d3.mouse(@get('svg')[0][0])
      if @isPointInside(x, y)
        return if @get('_is_hovered')
        @set('_is_hovered', true)
        @get('parent').dragover()
      else
        if @get('_is_hovered')
          @set('_is_hovered', false)
          @get('parent').dragout()
        for el in @get('parent').getNeighbourElements()
          if el.isPointInside(x, y)
            continue if el.get('_is_hovered')
            el.set('_is_hovered', true)
            el.get('parent').dragover()
          else
            continue unless el.get('_is_hovered')
            el.set('_is_hovered', false)
            el.get('parent').dragout()

    touchEnd: ->
      return if Graphics.mouse_detected
      [x, y] = d3.mouse(@get('svg')[0][0])
      cur_el = null
      if @isPointInside(x, y)
        cur_el = @
      else
        for el in @get('parent').getNeighbourElements()
          if el.isPointInside(x, y)
            cur_el = el
      if cur_el
        if cur_el.get('_is_hovered')
          cur_el.get('parent').dragout()
        cur_el.get('parent').dragstop()
      @tmpArrowTo(0)
      Graphics.rollbackActions()

    isPointInside: (x, y) ->
      coord = @get('coord')
      _vert = 27 / 2
      _hori = 27 * Math.sqrt(3) / 2
      q2x = Math.abs(x - coord.x)
      q2y = Math.abs(y - coord.y)
      return false if q2x > _hori || q2y > _vert*2
      m = 2 * _vert * _hori - _vert * q2x - _hori * q2y
      return m >= 0

    animateHoverIn: ->
      unless Graphics.animate
        @get('hexagon').attr('stroke-width', 24)
        return
      @get('hexagon')
        .transition()
        .attr('stroke-width', 24)
        .ease('easeInOutCirc')

    animateHoverOut: ->
      unless Graphics.animate
        @get('hexagon').attr('stroke-width', 18)
        return
      @get('hexagon')
        .transition()
        .attr('stroke-width', 18)
        .ease('easeInOutCirc')

    highlight: (num_extra, duration)->
      hexagon = @get('hexagon')

      fn = (_duration)->
        hexagon.attr('opacity', .2)
        setTimeout((-> hexagon.attr('opacity', .6)), _duration)
        if num_extra-- > 0
          setTimeout((-> fn(_duration)), _duration * 1.5)
      if num_extra
        fn(100)
      else
        fn(duration)

      #self = @
      #self.animateHoverIn()
      #setTimeout((-> self.animateHoverOut()), 100)
  })
