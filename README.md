
# About

This repository contains a JavaScript library for visualizing complex supply chains.

It was developed as part of SEI's [Producer to Consumer Sustainability Initiative](http://www.sei-international.org/producer-to-consumer-sustainability) for the [Transformative Transparency Platform](https://ttp.sei-international.org/) (learn more [here](http://www.sei-international.org/mediamanager/documents/Publications/sei-gcp-db-transformativetransparency.pdf)).

Comments and questions: [clement.suavet@sei-international.org](mailto:clement.suavet@sei-international.org)

# Interactive Sankey diagram

The upper panel contains an interactive Sankey diagram.

## Initial state

On each layer the nodes are sorted by amount of quantities that flow through them. Only the first 9 nodes are show individually; all others get aggregated into **OTHER**. Nodes with names starting by **UNKNOWN** are automatically placed at the top of the layer.

## Clicking nodes

When a node is clicked, all the individual flows that pass through that node are colored.

When more than one node is clicked on the same layer, they are given different colors.

The **+** sign above the layer description can be used to automatically click and color all the nodes from that layer.

When more than one layer contain one clicked node each, the flows that pass through all the clicked nodes are colored.

It is possible to click multiple nodes on one layer and at most one node on each of the other layers. In that case, the flows that pass through all the single nodes and one of the nodes of the layer with multiple clicked nodes are colored.

## Zooming into the supply chain

The button **Zoom into selected nodes** can be used to exclude the flows that do not pass through any of the clicked nodes.

The button **Exclude selected nodes** can be used to exclude the flows that pass through any of the clicked nodes.

Clicking on any of the aggregated **OTHER** nodes excludes all the flows passing through the 9 nodes from the layer in the current representation. It is equivalent to selecting all the nodes from that layer, and clicking 'Exclude selected nodes'.

The **-** sign above the layer description can be used to remove a layer from the current representation.

Layers can be selected by clicking the circles above the layer descriptions, and the button **Select layers** can be used to exclude unselected layers.

It is possible to zoom into individual nodes by selecting them by name from the drop down list **Select node by name**.

## Rescaling the supply chain

The drop down list **QuantityX (UnitX)** can be used to rescale the current Sankey diagram according to different quantities associated with the material flows.

## Resetting the visualization

The **Reset** button can be used to return to the initial representation of the supply chain.

# Interactive donut charts

The lower panel contains 3 donut charts.

The chart on the left (or right) shows the distribution of origins (or destinations) of the flows passing through the node currently under the mouse.

If one intermediate layer contains clicked nodes, the central chart shows the distribution of flows passing through the node currently under the mouse in the clicked layer.

# Data file structure

The supply chain is represented by the following objects:
- *unit*, an array giving the units in which the quantities flowing along the supply chain are measured;
- *nodes*, an array of nodes objects with the properties *name* and *type*;
- *links*, an array of objects representing elemental flows between the same sequence of nodes, with the properties 'listNodes' (an array giving the names of the node objects) and *value* (giving the amounts flowing along the path, in units given by the array *unit*).
