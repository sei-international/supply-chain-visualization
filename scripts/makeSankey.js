// unit
var units;
var unitList;

var u = 0;

// number of levels with more than 1 node clicked
var nSup;

// number of levels with clicked nodes
var nNodesLevels = [];

// determine size of Sankey based on user window size
var w = window,
  d = document,
  e = d.documentElement,
  g = d.getElementsByTagName('body')[0],
  xWindow = w.innerWidth || e.clientWidth || g.clientWidth,
  yWindow = w.innerHeight|| e.clientHeight|| g.clientHeight;

var margin = {top: 0, right: 10, bottom: 60, left: 10},
  width = (xWindow - margin.left - margin.right),
  height = Math.floor(yWindow * 0.43) - margin.top - margin.bottom - 30;

// max length of string in boxes
var cutoffStrings = 12;

var formatNumber = d3.format(",.0f"),  // zero decimal places
  format = function(d) {
    return formatNumber(d) + " " + units
  };
 
// append the svg canvas to the page
var svg = d3.select("#chart").append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", 
      "translate(" + margin.left + "," + margin.top + ")");

// Set the sankey diagram properties
var sankey = d3.sankey()
  .nodeWidth((function() {return Math.min(width / 10, 90)})())
  .nodePadding(0)
  .size([width, height]);

// color scale
o = d3.scale.category10()
  .domain([1,2,3,4,5,6,7,100,8,9])

// function to create svg path
var path = sankey.link();

// initialized global variables
var clickedNodes = [];
var clickedNodeNames = [];
var activatedNodes = [[]];
var excludedNodeTypes = [];
var excludedNodes = [];
var selectedLayers = [];
var currentLinks = [[]];
var seq = [];
var subNodes;
var newNodes;
var newFlows;
var aggFlows;

// main program sequence
draw();

/* FUNCTIONS */

// draw full Sankey if no clicked nodes, or subset including only activated nodes
function draw() {
  d3.json(file, function(error, graph) {

    unitList = graph.unit;
    units = unitList[u]

    clearDiagram();

    // replace node names by node objects
    var nodeMap = {};
    graph.nodes.forEach(function(x) {nodeMap[x.name] = x});

    // remove nodes from excluded layers from clicked nodes
    newClickedNodes = [];
    newClickedNodeNames = [];
    clickedNodes.forEach(function(x) {
      if (!excludedNodeTypes.indexOf(x.type) > -1) {
        newClickedNodes.push(x);
        newClickedNodeNames.push(x.name);
      }
    });
    clickedNodes = newClickedNodes;
    clickedNodeNames = newClickedNodeNames;

    // remove nodes from excluded layers from activated nodes
    newActivatedNodes = [];
    activatedNodes.forEach(function(x) {
      newList = [];
      x.forEach(function(y) {
        if (!excludedNodeTypes.indexOf(y.type) > -1) {
          newList.push(y)
        }
      })
      newActivatedNodes.push(newList);
    });
    activatedNodes = newActivatedNodes;

    // remove excluded nodes from data
    subNodes = [];
    graph.nodes.forEach(function(x) {
      if (excludedNodeTypes.indexOf(x.type) > -1 || excludedNodes.indexOf(x.name) > -1) {}
      else {
        subNodes.push(x)
       }
     });

    // remove excluded links from data
    subLinks = [];
    graph.links.forEach(function(x) {
      if (x.listNodes.some(function(w) {
        return excludedNodes.indexOf(w) > -1
      })) {}
      else {
        newListNodes = [];
        x.listNodes.forEach(function(y) {
          if (excludedNodeTypes.every(function(z) {return nodeMap[y].type != z})) {
            newListNodes.push(nodeMap[y])
          }
        })
        subLinks.push({
          listNodes: newListNodes,
          value: x.value
        })
      }
    });

    // prepare container for current links
    currentLinks = [[]];
    if (clickedNodes.length > 0) {
      for (i = 0; i < activatedNodes.length; i++) {
        currentLinks.push([])
      }
    };

    // get all links from data file if no clicked node
    if (clickedNodes.length == 0) {
      subLinks.forEach(function(x) {
        currentLinks[0].push(x)
      })
    }
    // select activated nodes and sort by group if clicked nodes
    else {
      currentLinks[0] = []
      subLinks.forEach(function(x) {
        for (i = 1; i <= activatedNodes.length; i++) {
          if (x.listNodes.every(function(y) {
            return activatedNodes[i-1].some(function(z) {return z.name == y.name})
          })) {
            currentLinks[i].push(x);
            break;
          }
        }
      })
    };

    updateSankey();
    addLinks();
    addNodes();
    addGauge();
    d3.selectAll(".node").remove()
    addNodes();
    addDir();

  })

};


// clear node selections
function reset() {
  clickedNodes = [];
  clickedNodeNames = [];
  activatedNodes = [[]];
  excludedNodeTypes = [];
  excludedNodes = [];
  selectedLayers = [];
  draw();

};

// subset supply chain including clicked nodes only
function subset() {
  clickedNodes.forEach(function(a) {
    subNodes.filter(function(b){
      return b.type == a.type && clickedNodes.every(function(c) {
        return b != c
      })
    }).forEach(function(d){
      excludedNodes.push(d.name)
    })
  })
  excludedNodes = Array.from(new Set(excludedNodes));
  draw();
  setTimeout(function(){
    clickedNodes = [];
    clickedNodeNames = [];
  },5000);
};

// clear diagram
function clearDiagram() {

  d3.selectAll(".link").remove();
  d3.selectAll(".node").remove();
  d3.selectAll(".invRect").remove();
  d3.selectAll(".nodeRect").remove();
  d3.selectAll(".gauge").remove();
  d3.selectAll(".cir").remove();
  d3.selectAll(".cir2").remove();
  d3.selectAll(".arrow").remove();
  d3.selectAll(".arrowhead").remove();
  d3.selectAll(".nodeType").remove();
  d3.selectAll(".del").remove();
  d3.selectAll(".sel").remove();
  d3.selectAll(".plus").remove();
  d3.selectAll(".minus").remove();

};

// exclude nodes
function exclude() {
  clickedNodes.forEach(function(x) {excludedNodes.push(x.name)});
  clickedNodes = [];
  clickedNodeNames = [];
  activatedNodes = [[]];
  draw();
};

// redefine link color groups based on clicked nodes without subsetting data
function regroupLinks(links) {

  // flatten list of links
  var flatLinks = [];
  links.forEach(function(x) {
    x.forEach(function(y) {
      flatLinks.push(y)
    })
  });

  // prepare container for current links
  currentLinks = [[]];
  if (clickedNodes.length > 0) {
    for (i = 0; i < clickedNodes.length; i++) {
      currentLinks.push([])
    }
  };

  // get all links from data file if no clicked node
  if (clickedNodes.length == 0) {
    flatLinks.forEach(function(x) {
      currentLinks[0].push(x)
    })
  }

  // select activated nodes and sort by group if clicked nodes
  else {
    flatLinks.forEach(function(x) {
      active = false;
      for (i = 0; i < activatedNodes.length; i++) {
        if (x.listNodes.every(function(y) {
          return activatedNodes[i].indexOf(y) > -1
        })) {
          currentLinks[i+1].push(x);
          active = true;
          break;
        }
      }
      // put at index 0 if not connected to clicked nodes
      if (!active) {
        currentLinks[0].push(x);
      }
    })
  }

  return currentLinks;

};

// transform data to separate flows by color group and merge similar links
function updateSankey() {

  units = unitList[u];

  // break down listNodes into individual flows
  var newLinks = [];
  for (i = 0; i < currentLinks.length; i++) {
    currentLinks[i].forEach(function(x) {
      for (j = 0; j < (x.listNodes.length - 1); j++) {
        newLinks.push({
          source: x.listNodes[j],
          target: x.listNodes[j + 1],
          listNodes: x.listNodes,
          value: +x.value[u],
          color: i,
          rank: 0
        })
      }
    })
  };

  // combine individual flows that have same source and target, separating inactive and active flows
  var dict = [{}];
  for (i = 0; i < activatedNodes.length; i++) {
    dict.push({})
  };

  newLinks.forEach(function(x) {
    // check whether source already in dict
    if (dict[x.color].hasOwnProperty(x.source.name)) {
      // check whether target already in dict
      if (dict[x.color][x.source.name].hasOwnProperty(x.target.name)) {
        // add link value
        dict[x.color][x.source.name][x.target.name] = dict[x.color][x.source.name][x.target.name] + x.value;
      }
      else {
        // add target
        dict[x.color][x.source.name][x.target.name] = x.value;
      }
    }
    else {
      // add source and target
      dict[x.color][x.source.name] = {};
      dict[x.color][x.source.name][x.target.name] = x.value;
    }
  });

  // get all flows from dict
  allFlows = [];
  for (i = 0; i <= activatedNodes.length; i++) {
    subNodes.forEach(function(x) {
      if (dict[i].hasOwnProperty(x.name)) {
        subNodes.forEach(function (y) {
          if (dict[i][x.name].hasOwnProperty(y.name)) {
            allFlows.push({
              source: x,
              target: y,
              value: dict[i][x.name][y.name],
              color: i,
              rank: 0
            });
          }
        })
      }
    })
  };
    
  // compute Sankey to get 'x' value for nodes
  sankey
    .nodes(subNodes)
    .links(allFlows)
    .layout(32)

  newFlows = allFlows

  // aggregate nodes beyond top 10 into 'others'
  subNodes.sort(function(a, b) {
    return (a.x * 10000 + a.dy) - (b.x * 10000 + b.dy)
  })

  var c = ''
  var n = 0
  var dictOthers = {}
  var typeOthers = {}
  var t
  newNodes = []

  for (i = subNodes.length - 1; i >= 0 ; i--) {
    var d = subNodes[i];
    if (c == d['x']) {
      if (n < 8 && d['dy'] > 4) {
        dictOthers[d['name']] = d
        newNodes.push(d)
        t = d['type']
      }
      else {
        if (typeOthers.hasOwnProperty(d['type'])) {
          dictOthers[d['name']] = typeOthers[d['type']]
        }
        else {
          typeOthers[d['type']] = {
            name: 'OTHER ' + d['type'],
            type: d['type']
          }
          dictOthers[d['name']] = typeOthers[d['type']]
          newNodes.push(dictOthers[d['name']])
        }
      }
      n = n + 1
      c = d['x']
    }
    else {
      dictOthers[d['name']] = d
      newNodes.push(dictOthers[d['name']])
      n = 0
      c = d['x']
    }
  };

  // redefine flows by aggregating 'others'
  newFlows.forEach(function(d) {
    d.source = dictOthers[d.source.name]
    d.target = dictOthers[d.target.name]
  });

  // combine individual flows that have same source and target, separating inactive and active flows
  var dict = [{}];
  for (i = 0; i < activatedNodes.length; i++) {
    dict.push({})
  };

  newFlows.forEach(function(x) {
    // check whether source already in dict
    if (dict[x.color].hasOwnProperty(x.source.name)) {
      // check whether target already in dict
      if (dict[x.color][x.source.name].hasOwnProperty(x.target.name)) {
        // add link value
        dict[x.color][x.source.name][x.target.name] = dict[x.color][x.source.name][x.target.name] + x.value;
      }
      else {
        // add target
        dict[x.color][x.source.name][x.target.name] = x.value;
      }
    }
    else {
      // add source and target
      dict[x.color][x.source.name] = {};
      dict[x.color][x.source.name][x.target.name] = x.value;
    }
  });

  // get all flows from dict
  aggFlows = [];
  for (i = 0; i <= activatedNodes.length; i++) {
    newNodes.forEach(function(x) {
      if (dict[i].hasOwnProperty(x.name)) {
        newNodes.forEach(function (y) {
          if (dict[i][x.name].hasOwnProperty(y.name)) {
            aggFlows.push({
              source: x,
              target: y,
              value: dict[i][x.name][y.name],
              color: i,
              rank: 0
            });
          }
        })
      }
    })
  };


  //
  aggFlows.forEach(function(x) {
    if (x.source.name.slice(0,6) == 'OTHER ') {p = 0} else {p = x.source.y}
    if (x.target.name.slice(0,6) == 'OTHER ') {q = 0} else {q = x.target.y}
    x.rank = p + q + x.color * 10000;
  });

  // compute Sankey with updated 'rank' of links
  sankey
    .nodes(newNodes)
    .links(aggFlows)
    .layout(32)

  addOptions();

};

// add in the links
function addLinks() {

  var link = svg.append("g").selectAll(".link")
    .data(aggFlows)
    .enter().append("path")
    .attr("class", "link")
    .attr("d", path)
    .style("fill", "none")
    .style("stroke-width", function(d) {
      return Math.max(1, d.dy)
    })
    .style("stroke", function(d) {
      if (d.color == 0 || d.color > 20) {
        return "grey"
      }
      else {
        return o(d.color)
      }
    });

  // add the link titles
  link.append("title")
    .text(function(d) {
      return d.source.name + " → " + d.target.name + "\n" + format(d.value)
    });

};

// add in the nodes
function addNodes() {
  var node = svg.append("g").selectAll(".node")
    .data(newNodes)
    .enter().append("g")
    .attr("class", "node")
    .attr("transform", function(d) { 
      return "translate(" + d.x + "," + d.y + ")";
    });


  // add node title
  node.append("title")
    .text(function(d) {
      if (d.name.slice(0,6) == 'OTHER ') {
        return d.name + "\n" + format(d.value) + "\nClick to subset and expand"
      } else {
        return d.name + "\n" + format(d.value)
      }
    });

  // add node text
  node.append("text")
    .attr("class", "nodeTitle")
    .attr("x", 2)
    .attr("y", function(d) {if (d.dy <= 12) {return 6} else {return 8}})
    .attr("dy", ".35em")
    .attr("text-anchor", "start")
    .attr("fill", "black")
    .text(function(d) {
      if (d.dy > 12) {
        if (d.name.length <= cutoffStrings) {
          return d.name
        }
        else {
          return d.name.slice(0,cutoffStrings-1) + '.'
        }
      }
    });

  // add the rectangles for the nodes
  node.append("rect")
    .attr("class", "nodeRect")
    .attr("height", function(d) {
      return d.dy
    })
    .attr("width", sankey.nodeWidth())
    .attr("name", function (d) {
      return d.name
    })
    .style("fill", "white")
    .style("stroke", "black")
    .style("stroke-width", function(d) {
      if (clickedNodes.indexOf(d) > -1) {
        return "2px"
      }
      else {
        return "1px"
      }
    })
    .style("fill-opacity", 0)

    .on("mouseover", function(d) {bakePies(d)})

    .on("click", function(d) {

      if (d.name.slice(0,6) == 'OTHER ') {
        clickedNodes = [];
        clickedNodeNames = [];
        d3.selectAll(".node").data().filter(function(a) {
          return a.x == d.x && a.name.slice(0,6) != 'OTHER '
        }).forEach(function(x) {
          excludedNodes.push(x.name)
        });
        draw();
      }

      else {
        // clear temporary diagram elements
        d3.selectAll(".gauge").remove()
        d3.selectAll(".link").remove();
        d3.selectAll(".nodeRect").remove();
        d3.selectAll(".nodeTitle").remove();

        // add to clicked nodes or remove if already clicked
        if (clickedNodeNames.indexOf(d.name) > -1) {
          var e = clickedNodes.indexOf(d);
          clickedNodes.splice(e, 1);
          e = clickedNodeNames.indexOf(d.name);
          clickedNodeNames.splice(e, 1);
          if (clickedNodes.length == 0) {
            var flatLinks = [];
            currentLinks.forEach(function(x) {
              x.forEach(function(y) {
                flatLinks.push(y)
              })
            });
            currentLinks = [flatLinks];
            updateSankey();
            addLinks();
            addGauge();
            addNodes();
            return
          }
        }
        else {clickedNodes.push(d); clickedNodeNames.push(d.name)}
        clickedNodes.sort(function(a, b) {return a.y - b.y})

        // find levels to which clicked nodes belong
        var levels = [];
        var dictLevels = {};
        var dictNodes = {};

        d3.selectAll(".node").data().filter(function(d) {
          return clickedNodes.indexOf(d) > -1
        }).forEach(function(d) {
          levels.push(d.x);
          dictLevels[d.name] = d.x;
          if (dictNodes.hasOwnProperty('X' + d.x)) {
            dictNodes['X' + d.x].push(d)
            dictNodes['X' + d.x] = Array.from(new Set(dictNodes['X' + d.x]));
          }
          else {
            dictNodes['X' + d.x] = [d]
          }
        });

        nNodesLevels = []
        Object.getOwnPropertyNames(dictNodes).forEach(function(x) {
          nNodesLevels.push(dictNodes[x].length);
        })

        nSup = 0;
        nNodesLevels.forEach(function(x) {
          if (x > 1) {
            nSup = nSup + 1
          }
        });

        // flatten list of links
        var flatLinks = [];
        currentLinks.forEach(function(x) {
          x.forEach(function(y) {
            flatLinks.push(y)
          })
        });

        // all clicked nodes on same level
        if (nNodesLevels.length == 1) {
          // find all nodes connected to clicked nodes through links (with duplicates)
          activatedNodes = [];
          for (i = 0; i < clickedNodes.length; i++) {
            activatedNodes.push([]);
            flatLinks.forEach(function(x) {
              if (x.listNodes.indexOf(clickedNodes[i]) > -1) {
                x.listNodes.forEach(function(y) {
                  activatedNodes[i].push(y);
                  activatedNodes[i] = Array.from(new Set(activatedNodes[i]));
                })
              }
            })
          };

          // redefine color groups based on clicked nodes
          currentLinks = regroupLinks(currentLinks);
          // update sankey based on new rank
          updateSankey();
          // draw new links
          addLinks();

          addGauge();
          addNodes();
        }

        // one clicked node per level
        else if (nSup == 0) {
          currentLinks = [[],[]];
          activatedNodes = [[]];
          flatLinks.forEach(function(x) {
            if (clickedNodes.every(function(y) {
              return x.listNodes.indexOf(y) > -1
            })) {
              currentLinks[1].push(x);
              x.listNodes.forEach(function(z) {activatedNodes[0].push(z)})
            }
            else {
              currentLinks[0].push(x);
            }
          });
          updateSankey();
          addLinks();
          activatedNodes = Array.from(new Set(activatedNodes))

          addGauge();
          addNodes();
        }

        // multiple nodes on 1 level + levels with 1 node
        else if (nSup == 1) {
          // save clicked nodes for retrieval after link selection
          var saveClickedNodes = clickedNodes;
          // separate clicked nodes that are alone on their level
          var lonelyNodes = []
          Object.getOwnPropertyNames(dictNodes).forEach(function(x) {
            if (dictNodes[x].length > 1) {
              clickedNodes = dictNodes[x];
              clickedNodes.sort(function(a,b) {return a.dy - b.dy})
            }
            else {
              lonelyNodes.push(dictNodes[x][0])
            }
          })

          // exclude links that don't pass through all lonelyNodes and one other node
          includeLinks = [];
          flatLinks.forEach(function(x) {
            if (lonelyNodes.every(function(y) {
              return x.listNodes.indexOf(y) > -1
            }) && clickedNodes.some(function(y) {
              return x.listNodes.indexOf(y) > -1
            })) {
              includeLinks.push(x)
            }
          });

          // find all nodes connected to clicked nodes through links (with duplicates)
          activatedNodes = [];
          for (i = 0; i < clickedNodes.length; i++) {
            activatedNodes.push([]);
            includeLinks.forEach(function(x) {
              if (x.listNodes.indexOf(clickedNodes[i]) > -1) {
                x.listNodes.forEach(function(y) {
                  activatedNodes[i].push(y);
                  activatedNodes[i] = Array.from(new Set(activatedNodes[i]));
                })
              }
            })
          };
          // redefine color groups based on clicked nodes
          currentLinks = regroupLinks(currentLinks);
          // update sankey based on new rank
          updateSankey();
          // draw new links
          addLinks();
          // recombine clicked nodes
          clickedNodes = saveClickedNodes;

          addGauge();
          addNodes();
        }

        // more than 1 node on more than 1 level
        else {
          var e = clickedNodes.indexOf(d);
          clickedNodes.splice(e, 1);
          var e = clickedNodeNames.indexOf(d);
          clickedNodeNames.splice(e, 1);
          updateSankey();
          addLinks();
          addNodes();
          alert("NODE SELECTION IS NOT VALID:\nOne layer at most can contain multiple selected nodes");
        }
      }

    });

};

// add inner boxes in node rectangles
function addGauge() {

  // initialize gauge counter for all nodes if no previous clicked node
  var gaugeCount = {};
  d3.selectAll(".node").data().forEach(function(d) {
    gaugeCount[d.name] = 0
  });

  // all links
  var connectedLinks = Array.from(new Set(d3.selectAll(".link").data()))

  // draw inner boxes in activated nodes
  for (i = activatedNodes.length - 1; i >= 0; i--) {
    var rien = Array.from(new Set(d3.selectAll(".node").data()));
    // need to remove duplicated 'other' nodes (I don't know why this happens)
    newRienNames = []
    var newRien = []
    rien.forEach(function(x) {if (newRienNames.indexOf(x.name) > -1) {} else {newRienNames.push(x.name); newRien.push(x);}})
    rien = newRien

    // draw box by summing on incoming activated links
    rien.forEach(function(d) {
      var gauge = 0;
      connectedLinks.filter(function(p) {
        return p.target.name == d.name && p.color == i + 1
      }).forEach(function(r) {
        gauge = gauge + r.dy;
      });

      // draw box for nodes on 1st layer by summing on outgoing links
      if (gauge == 0) {
        connectedLinks.filter(function(p) {
          return p.source.name == d.name && p.color == i + 1
        }).forEach(function(r) {
          gauge = gauge + r.dy;
        })
      };

      // append inner rectangles
      svg.append("rect")
        .attr("class", "gauge")
        .attr("transform", function() {
          return "translate(" + d.x + "," + (d.y + d.dy - gauge - gaugeCount[d.name]) + ")";
        })
        .attr("height", function() {return gauge})
        .attr("width", sankey.nodeWidth())
        .style("fill", function(d) {return o(i+1)})

      gaugeCount[d.name] = gaugeCount[d.name] + gauge;

    });
  }
};

// add node directory showing sequence of node types
function addDir() {

  // sequence of node types
  seq = [];
  var c = '';

  if (clickedNodes.length == 0) {
    d3.selectAll(".node").data().filter(function(x) {
      return excludedNodeTypes.every(function(y) {
        return y != x.type
      }) && !excludedNodes.indexOf(x.name) > -1
    }).filter(function(x) {
      return x.dy > 0
    }).sort(function(a, b) {
      return a.x - b.x
    }).forEach(function(d) {
      if (d.type != c) {
        seq.push([d.type, d.x]);
        c = d.type;
      }
    })
  }

  else {
    flatNodes = [];
    activatedNodes.forEach(function(x) {
      x.forEach(function(y) {
        var r = d3.selectAll(".node").data().filter(function(z) {
          return y.name == z.name
        });
        if (r.length > 0) {
          flatNodes.push(r[0])
        }
      })
    });
    flatNodes.sort(function(a, b) {
      return a.x - b.x
    }).forEach(function(d) {
        if (d.type != c && excludedNodeTypes.every(function(z) {
          return z != d.type
        }) && !excludedNodes.indexOf(d.name) > -1) {
          seq.push([d.type, d.x]);
          c = d.type;
        }
    });
  }

  listTypes = [];
  seq.forEach(function(x) {listTypes.push(x[0])});
  var circle = svg.selectAll(".cir").data(seq).enter().append("g")

  circle.attr("name", function(d) {
    return d[0]
  });

  circle.append("circle")
    .attr("class", "cir")
    .attr("cx", 0)
    .attr("cy", 0)
    .attr("r", 15)
    .attr("transform", function(d) {
      return "translate(" + (d[1] + sankey.nodeWidth() / 2) + "," + (height + margin.bottom * 0.45) + ")";
    })
    .style("stroke", "black")
    .style("fill", "white")

  circle.append("circle")
    .attr("class", "cir2")
    .attr("cx", 0)
    .attr("cy", 0)
    .attr("r", 10)
    .attr("transform", function(d) {
      return "translate(" + (d[1] + sankey.nodeWidth() / 2) + "," + (height + margin.bottom * 0.45) + ")";
    })
    .style("stroke", "black")
    .style("fill", "white");

  circle.append("rect")
    .attr("class", "invRect")
    .attr("height", 44)
    .attr("width", 44)
    .attr("title", "Click to select layer")
    .attr("transform", function(d) {
      return "translate(" + (d[1] + sankey.nodeWidth() / 2 - 22) + "," + (height + margin.bottom * 0.45 - 22) + ")";
    })
    .style("fill", "blue")
    .style("opacity", 0)

    .on("click", function(d) {
      if (selectedLayers.indexOf(d[0]) > -1) {
        d3.selectAll(".cir2").filter(function(x) {
          return x[0] == d[0]
        }).style("fill", "white") 
        var e = selectedLayers.indexOf(d[0])
        selectedLayers.splice(e, 1)  
      }
      else {
        d3.selectAll(".cir2").filter(function(x) {
          return x[0] == d[0]
        }).style("fill", "grey")
        selectedLayers.push(d[0])  
      }
    })

    .on("mouseover", function(d) {

      if (selectedLayers.indexOf(d[0]) > -1) {
        d3.selectAll(".invRect").filter(function(x) {
          return x[0] == d[0]
        }).attr("title", "Click to deselect layer")
      }
      else {
        d3.selectAll(".invRect").filter(function(x) {
          return x[0] == d[0]
        }).attr("title", "Click to select layer")
      }

      d3.selectAll(".sel").remove();
      d3.selectAll(".del").remove();
      d3.selectAll(".plus").remove();
      d3.selectAll(".minus").remove();

      // plus sign
      circle.filter(function(x) {return x[0] == d[0]}).append("path")
        .attr("class", "plus")
        .attr("d", function(d) {return "M -2.5 0 L 2.5 0"})
        .attr("transform", function(d) {
          return "translate(" + (d[1] + sankey.nodeWidth() / 2 + 17) + "," + (height + margin.bottom * 0.45 - 17) + ")";
        })
        .style("stroke","black")
        .style("stroke-width", "2px")

      circle.filter(function(x) {return x[0] == d[0]}).append("path")
        .attr("class", "plus")
        .attr("d", function(d) {return "M 0 -2.5 L 0 2.5"})
        .attr("transform", function(d) {
          return "translate(" + (d[1] + sankey.nodeWidth() / 2 + 17) + "," + (height + margin.bottom * 0.45 - 17) + ")";
        })
        .style("stroke","black")
        .style("stroke-width", "2px")

      // select all nodes belonging to level
      circle.filter(function(x) {return x[0] == d[0]}).append("circle")
        .attr("class", "sel")
        .attr("cx", 0)
        .attr("cy", 0)
        .attr("r", 5)
        .attr("transform", function(d) {
          return "translate(" + (d[1] + sankey.nodeWidth() / 2 + 17) + "," + (height + margin.bottom * 0.45 - 17) + ")";
        })
        .style("fill", "white")
        .style("stroke", "black")
        .style("fill-opacity", 0)

        .on("mouseover", function(d) {
          d3.select(".sel").filter(function(x) {
            return x[0] == d[0]
          }).append("title").text("Click to select all nodes from this level")
        })

        .on("click", function(d) {

          // change color of outer circle DOES NOT WORK
          //var outCir = d3.selectAll(".cir").filter(function(x) {return x[0] == d[0]})
          //outCir.style("stroke","red")

          // flatten list of links
          var flatLinks = [];
          currentLinks.forEach(function(x) {
            x.forEach(function(y) {
              flatLinks.push(y)
            })
          });

          levelNodes = [];
          levelNodeNames = [];
          d3.selectAll(".node").data().forEach(function(x) {
            if (x.type == d[0] && x.name.slice(0,6) != 'OTHER ' && x.dy > 0) {
              if (levelNodeNames.indexOf(x.name) > -1) {}
              else {
                levelNodes.push(x);
                levelNodeNames.push(x.name)
              }
            }
          });

          clickedNodes = levelNodes;
          clickedNodeNames = levelNodeNames;
          clickedNodes.sort(function(a, b) {return a.y - b.y});



          // find all nodes connected to clicked nodes through links (with duplicates)
          activatedNodes = [];
          for (i = 0; i < clickedNodes.length; i++) {
            activatedNodes.push([]);
            flatLinks.forEach(function(x) {
              if (x.listNodes.indexOf(clickedNodes[i]) > -1) {
                x.listNodes.forEach(function(y) {
                  activatedNodes[i].push(y);
                  activatedNodes[i] = Array.from(new Set(activatedNodes[i]));
                })
              }
            })
          };

          // redefine color groups based on clicked nodes
          currentLinks = regroupLinks(currentLinks);

          clearDiagram();
          updateSankey();
          addNodes();
          addLinks();
          addDir();
          addGauge();
          addNodes();

        });

      // minus sign
      circle.filter(function(x) {return x[0] == d[0]}).append("path")
        .attr("class", "minus")
        .attr("d", function(d) {return "M -2.5 0 L 2.5 0"})
        .attr("transform", function(d) {
          return "translate(" + (d[1] + sankey.nodeWidth() / 2 - 17) + "," + (height + margin.bottom * 0.45 - 17) + ")";
        })
        .style("stroke","black")
        .style("stroke-width", "2px")

      // delete node level
      circle.filter(function(x) {return x[0] == d[0]}).append("circle")
        .attr("class", "del")
        .attr("cx", 0)
        .attr("cy", 0)
        .attr("r", 5)
        .attr("transform", function(d) {
          return "translate(" + (d[1] + sankey.nodeWidth() / 2 - 17) + "," + (height + margin.bottom * 0.45 - 17) + ")";
        })
        .style("stroke", "black")
        .style("fill", "white")
        .style("fill-opacity", 0)

        .on("mouseover", function(d) {
          d3.select(".del").filter(function(x) {
            return x[0] == d[0]
          }).append("title").text("Click to delete this layer of nodes")
        })

        .on("click", function(d) {
          // flatten list of links
          var flatLinks = [];
          currentLinks.forEach(function(x) {
            x.forEach(function(y) {
              flatLinks.push(y)
            })
          });
          excludedNodeTypes.push(d[0]);
          var e = listTypes.indexOf(d[0])
          flatLinks.forEach(function(x) {
            x.listNodes.splice(e, 1)
          })
          currentLinks = [flatLinks];

          clearDiagram();
          updateSankey();
          addNodes();
          addLinks();
          addDir();
          addGauge();

      })

  });

  // add lines between circles in node directory
  circle.filter(function(d) {return d[1] != width - sankey.nodeWidth()}).append("path")
    .attr("class", "arrow")
    .attr("d", function(d) {return "M 20 0 L " + ((width - sankey.nodeWidth()) / (seq.length - 1) - 20) + " 0"})
    .attr("transform", function(d) {
      return "translate(" + (d[1] + sankey.nodeWidth() / 2) + "," + (height + margin.bottom * 0.45) + ")";
    })
    .style("stroke", "grey")
    .style("stroke-width", "2px");

  // add arrowheads on lines in node directory
  circle.filter(function(d) {return d[1] != width - sankey.nodeWidth()}).append("path")
    .attr("class", "arrowhead")
    .attr("d", function(d) {return "M " + (0.5 * (width - sankey.nodeWidth()) / (seq.length - 1)) + " -7.5 l 15 7.5 l -15 7.5 Z"})
    .attr("transform", function(d) {
      return "translate(" + (d[1] + sankey.nodeWidth() / 2) + "," + (height + margin.bottom * 0.45) + ")";
    })
    .style("fill", "grey");

  // add node level titles
  circle.append("text")
    .attr("class", "nodeType")
    .attr("x", function(d) {
      if (seq.indexOf(d) == 0) {
        return d[1]
      }
      else if (seq.indexOf(d) == seq.length - 1) {
        return d[1] + sankey.nodeWidth()
      }
      else {
        return d[1] + sankey.nodeWidth() / 2
      }
    })
    .attr("y", function(d) {return height + margin.bottom * 0.9})
    .attr("dy", ".35em")
    .attr("text-anchor", function(d) {
      if (seq.indexOf(d) == 0) {
        return "start"
      }
      else if (seq.indexOf(d) == seq.length - 1) {
        return "end"
      }
      else {
        return "middle"
      }
    })
    .attr("fill", "black")
    .text(function(d) {return d[0]});

};

function rescale() {
  var e = document.getElementById("ddl");
  u = +e.options[e.selectedIndex].value;
  clearDiagram();
  updateSankey();
  addNodes();
  addLinks();
  addDir();
  addGauge();
}

// add options to 'Select node by name' drop down list

function createOption(ddl, text, value) {
    var opt = document.createElement('option');
    opt.value = value;
    opt.text = text;
    ddl.options.add(opt);
}

function addOptions() {
  subNodes.sort(function(a,b) {return a.name.localeCompare(b.name)}).filter(function(x) {
    return !clickedNodes.indexOf(d) > -1
  }).forEach(function(d) {
    createOption(ddlNode, d.name.slice(0,20), d.name)
  })
}

function selectNode() {
  reset();
  var e = document.getElementById("ddlNode");
  var selectedNodeName = e.options[e.selectedIndex].value;

  nSup = 0;
  activatedNodes = [[],[]];
  clickedNodes = subNodes.filter(function(x) {return x.name == selectedNodeName});
  clickedNodeNames = [selectedNodeName]
  subLinks.forEach(function(x) {
    if (x.listNodes.indexOf(clickedNodes[0]) > -1) {
      x.listNodes.forEach(function(y) {activatedNodes[0].push(y)});
    }
  });

}
