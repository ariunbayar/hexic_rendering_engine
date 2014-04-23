if typeof(d3) == "undefined"
  console.log "d3.js is not included. Consult with d3js.org"
  return

Graphics = ->
  @createSVG = (container_selector, width, height) ->
    d3.select(container_selector).append('svg')
      .attr('width', width)
      .attr('height', heigth)

  @drawArc = (container, x, y, inner_radius, outer_radius, fill_percent, color) ->
    g = container.append('g')
      .attr('transform', "translate(#{x}, #{y})")
    g.append('path')
      .attr('fill', color)
      .attr('d', Hexagon.arc.getD(0, 2 * Math.PI * fill_percent, inner_radius, outer_radius))

  @drawCircle = (container, x, y, r, border, colors) ->
    container.append('circle')
      .attr('cx', x)
      .attr('cy', y)
      .attr('r', r)
      .attr('stroke', colors.stroke)
      .attr('stroke-width', border)
      .attr('fill', colors.fill)

  @drawHexagon = (container, x, y, r, border, colors) ->
    container.append("svg:polygon")
      .attr('fill', '#fff')
      .attr('fill', colors.fill)
      .attr('stroke', colors.stroke)
      .attr('stroke-width', border)
      .attr("points", Helpers.polygon.getPoints(x, y, 6, r))

  return


Helpers = 
  arc:
    getD: (start_angle, end_angle, inner_radius, outer_radius) ->
      d3.svg.arc()
        .startAngle(start_angle)
        .innerRadius(inner_radius)
        .outerRadius(outer_radius)
        .endAngle(end_angle)

  polygon:
    getStarPoints: (centerX, centerY, arms, outerRadius, innerRadius) ->
      results = ""
      angle = Math.PI / arms

      for i in [0...(2 * arms)]
        # Use outer or inner radius depending on what iteration we are in.
        r = if (i & 1) == 0 then outerRadius else innerRadius

        currX = centerX + Math.cos(i * angle + angle) * r
        currY = centerY + Math.sin(i * angle + angle) * r

        # Our first time we simply append the coordinates, subsequet times
        # we append a ", " to distinguish each coordinate pair.
        if i == 0
          results = currX + "," + currY
        else
          results += ", " + currX + "," + currY

      return results

    getPoints: (centerX, centerY, arms, radius) ->
      results = ""
      angle = Math.PI * 2 / arms

      for i in [0...arms]
        currX = centerX + Math.cos(i * angle + angle/2) * radius
        currY = centerY + Math.sin(i * angle + angle/2) * radius

        # Our first time we simply append the coordinates, subsequet times
        # we append a ", " to distinguish each coordinate pair.
        if i == 0
            results = currX + "," + currY
        else
            results += ", " + currX + "," + currY

      return results

  rand: (n) ->
    Math.round(Math.random() * n)

  colors: (r, g, b) ->
    stroke: "rgba(#{r}, #{g}, #{b}, 1)"
    fill: "rgba(#{r}, #{g}, #{b}, .3)"

Settings =
  radius:   29
  border:   0
  offset_x: 2 * 30 * Math.sin(Math.PI / 3)
  offset_y: 2 * 30 * Math.sin(Math.PI / 3) * Math.sin(Math.PI / 3)
  colors:
    red: Helpers.colors(255, 0, 0)
    blue: Helpers.colors(0, 0, 255)
    gray: Helpers.colors(127, 127, 127)

window.Graphics = Graphics
window.Helpers = Helpers
window.Settings = Settings
