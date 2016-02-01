var inf = d3.select("#info").append("svg")
  .attr("width", function() {return 0.49 * xWindow})
  .attr("height", function() {return 0.49 * yWindow});

var radius = Math.min(yWindow * 0.135, 300);

var arc = d3.svg.arc()
    .outerRadius(radius - 5)
    .innerRadius(radius * 0.4);

var pie = d3.layout.pie()
    .sort(function(a,b) {return a[1] - b[1]})
    .value(function(d) { return d[1] });

var greyScale = ['#f2f2f2','#f2f2f2']

inf.append("circle")
  .attr("class", "pie1")
  .attr("cx", 0)
  .attr("cy", 0)
  .attr("r", function() {return radius})
  .attr("transform", function() {return "translate(" + (xWindow * 0.10) + "," + (yWindow * 0.25) + ")"})
  .style("stroke", "black")
  .style("fill", "beige")

inf.append("text")
  .attr("transform", function() {return "translate(" + (xWindow * 0.10) + "," + (yWindow * 0.25 + 10) + ")"})
  .attr("text-anchor", "middle")
  .text("FROM")
  .style("font-size", "20px")

inf.append("circle")
  .attr("class", "pie2")
  .attr("cx", 0)
  .attr("cy", 0)
  .attr("r", function() {return radius})
  .attr("transform", function() {return "translate(" + (xWindow * 0.40) + "," + (yWindow * 0.25) + ")"})
  .style("stroke", "black")
  .style("fill", "beige")

inf.append("text")
  .attr("transform", function() {return "translate(" + (xWindow * 0.40) + "," + (yWindow * 0.25 + 10) + ")"})
  .attr("text-anchor", "middle")
  .text("TO")
  .style("font-size", "20px")


inf.append("circle")
  .attr("class", "pie3")
  .attr("cx", 0)
  .attr("cy", 0)
  .attr("r", function() {return radius})
  .attr("transform", function() {return "translate(" + (xWindow * 0.25) + "," + (yWindow * 0.25) + ")"})
  .style("stroke", "black")
  .style("fill", "beige")

inf.append("text")
  .attr("transform", function() {return "translate(" + (xWindow * 0.25) + "," + (yWindow * 0.25 + 10) + ")"})
  .attr("text-anchor", "middle")
  .text("VIA")
  .style("font-size", "20px")


// show pie charts when mouse over node
function bakePies(d) {

  d3.selectAll(".nodeTitleInfo").remove()
  d3.selectAll(".arc1").remove()
  d3.selectAll(".arc2").remove()
  d3.selectAll(".arc3").remove()
  d3.selectAll(".slice1").remove()
  d3.selectAll(".slice2").remove()
  d3.selectAll(".slice3").remove()

  // draw title
  inf.append("text")
    .attr("class", "nodeTitleInfo")
    .attr("transform", function() {return "translate(" + (xWindow * 0.25) + "," + (yWindow * 0.05) + ")"})
    .attr("text-anchor", "middle")
    .text(function() {if (d.hasOwnProperty("F500")) {return d.name + ' (' + d.type + ') - ' + 'Forest 500 rank = ' + d.F500} else {return d.name + ' (' + d.type + ')'}})
    .style("font-size", "20px")

  var orig = {};
  var through = {};
  var dest = {};

  // sum on origin and destination
  subLinks.filter(function(x) {
    return x.listNodes.indexOf(d) > -1
  }).forEach(function(x){
    if (orig.hasOwnProperty(x.listNodes[0].name)) {
      orig[x.listNodes[0].name] += +x.value[u]
    }
    else {
      orig[x.listNodes[0].name] = +x.value[u]
    };
    if (dest.hasOwnProperty(x.listNodes[x.listNodes.length - 1].name)) {
      dest[x.listNodes[x.listNodes.length - 1].name] += +x.value[u]
    }
    else {
      dest[x.listNodes[x.listNodes.length - 1].name] = +x.value[u]
    };
    if (nNodesLevels.length == 1 && clickedNodes[0].type != seq[0][0] && clickedNodes[0].type != seq[seq.length - 1][0]) {
      var l;
      var i = 0;
      seq.forEach(function(y) {
        if (seq[i][0] == clickedNodes[0].type) {
          l = i;
        }
        i += 1;
      });
      if (through.hasOwnProperty(x.listNodes[l].name)) {
        through[x.listNodes[l].name] += +x.value[u]
      }
      else {
        through[x.listNodes[l].name] = +x.value[u]
      };
    }
  })

  var dataOrig = [];
  Object.getOwnPropertyNames(orig).forEach(function(x) {
    return dataOrig.push([x, orig[x]])
  });

  var dataDest = [];
  Object.getOwnPropertyNames(dest).forEach(function(x) {
    return dataDest.push([x, dest[x]])
  });

  var dataVia = [];
  Object.getOwnPropertyNames(through).forEach(function(x) {
    return dataVia.push([x, through[x]])
  });

  dataOrig.forEach(function(d) {
    d[1] = +d[1];
  });

  dataDest.forEach(function(d) {
    d[1] = +d[1];
  });

  dataVia.forEach(function(d) {
    d[1] = +d[1];
  });

  var from = inf.selectAll(".arc1")
      .data(pie(dataOrig).sort(function(a,b) {return a.value - b.value}))
    .enter().append("g")
      .attr("class", "arc1");

  from.append("path")
    .attr("class","slice1")
    .attr("d", arc)
    .attr("transform", function() {return "translate(" + (xWindow * 0.10) + "," + (yWindow * 0.25) + ")"})
    .attr("title", function(d) {return d.data[0] + ' ' + formatNumber(100 * (d.endAngle - d.startAngle) / 6.28) + '%'})
    .style("stroke", "black")
    .style("stroke-width", 0.5)
    .style("fill-opacity", 0.6)
    .style("fill", function(d, n) {
      for (var i = 0; i < activatedNodes.length; i++) {
        if (activatedNodes[i].filter(function(x) {
          return d.data[0] == x.name && clickedNodeNames.indexOf(d.data[0]) > -1
        }).length > 0) {
          return o(i + 1);
          break;
        }
      }
      return greyScale[n % 2]
    })

  var to = inf.selectAll(".arc2")
      .data(pie(dataDest).sort(function(a,b) {return a.value - b.value}))
    .enter().append("g")
      .attr("class", "arc2");

  to.append("path")
    .attr("class","slice2")
    .attr("d", arc)
    .attr("transform", function() {return "translate(" + (xWindow * 0.40) + "," + (yWindow * 0.25) + ")"})
    .attr("title", function(d) {return d.data[0] + ' ' + formatNumber(100 * (d.endAngle - d.startAngle) / 6.28) + '%'})
    .style("stroke", "black")
    .style("stroke-width", 0.5)
    .style("fill-opacity", 0.6)
    .style("fill", function(d, n) {
      for (var i = 0; i < activatedNodes.length; i++) {
        if (activatedNodes[i].filter(function(x) {
          return d.data[0] == x.name && clickedNodeNames.indexOf(d.data[0]) > -1
        }).length > 0) {
          return o(i + 1);
          break;
        }
      }
      return greyScale[n % 2]
    })

  from.append("text")
    .attr("transform", function(d) { return "translate(" + (arc.centroid(d)[0] + xWindow * 0.10) + "," + (arc.centroid(d)[1] + yWindow * 0.25) + ")" })
    .attr("dy", ".35em")
    .style("text-anchor", "middle")
    .text(function(d) {
      if ((d.endAngle - d.startAngle) / 6.28 > 0.03) {
        if (d.data[0].length <= cutoffStrings) {
          return d.data[0] + ' ' + formatNumber(100 * (d.endAngle - d.startAngle) / 6.28) + '%'
        }
        else {
          return d.data[0].slice(0,cutoffStrings-1) + '.' + ' ' + formatNumber(100 * (d.endAngle - d.startAngle) / 6.28) + '%'
        }
      }
    });

  to.append("text")
    .attr("transform", function(d) {return "translate(" + (arc.centroid(d)[0] + xWindow * 0.40) + "," + (arc.centroid(d)[1] + yWindow * 0.25) + ")"; })
    .attr("dy", ".35em")
    .style("text-anchor", "middle")
    .text(function(d) {
      if ((d.endAngle - d.startAngle) / 6.28 > 0.03) {
        if (d.data[0].length <= cutoffStrings) {
          return d.data[0] + ' ' + formatNumber(100 * (d.endAngle - d.startAngle) / 6.28) + '%'
        }
        else {
          return d.data[0].slice(0,cutoffStrings-1) + '.' + ' ' + formatNumber(100 * (d.endAngle - d.startAngle) / 6.28) + '%'
        }
      }
    });

  // central pie to display intermediate layer when more than 1 node clicked

  var via = inf.selectAll(".arc3")
      .data(pie(dataVia).sort(function(a,b) {return a.value - b.value}))
    .enter().append("g")
      .attr("class", "arc3");

  via.append("path")
    .attr("class","slice3")
    .attr("d", arc)
    .attr("transform", function() {return "translate(" + (xWindow * 0.25) + "," + (yWindow * 0.25) + ")"})
    .attr("title", function(d) {return d.data[0] + ' ' + formatNumber(100 * (d.endAngle - d.startAngle) / 6.28) + '%'})
    .style("stroke", "black")
    .style("stroke-width", 0.5)
    .style("fill-opacity", 0.6)
    .style("fill", function(d, n) {
      for (var i = 0; i < activatedNodes.length; i++) {
        if (activatedNodes[i].filter(function(x) {
          return d.data[0] == x.name && clickedNodeNames.indexOf(d.data[0]) > -1
        }).length > 0) {
          return o(i + 1);
          break;
        }
      }
      return greyScale[n % 2]
    })

  via.append("text")
    .attr("transform", function(d) {return "translate(" + (arc.centroid(d)[0] + xWindow * 0.25) + "," + (arc.centroid(d)[1] + yWindow * 0.25) + ")"; })
    .attr("dy", ".35em")
    .style("text-anchor", "middle")
    .text(function(d) {
      if ((d.endAngle - d.startAngle) / 6.28 > 0.03) {
        if (d.data[0].length <= cutoffStrings) {
          return d.data[0] + ' ' + formatNumber(100 * (d.endAngle - d.startAngle) / 6.28) + '%'
        }
        else {
          return d.data[0].slice(0,cutoffStrings-1) + '.' + ' ' + formatNumber(100 * (d.endAngle - d.startAngle) / 6.28) + '%'
        }
      }
    });

}

