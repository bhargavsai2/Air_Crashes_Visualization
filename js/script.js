let fullData;
let x;
let colorScale4 = d3.scaleSequential(d3.interpolateReds);
const colorScale = d3.scaleThreshold()
    .domain([0, 10, 15, 20, 25, 30, 35])
    .range(d3.schemeReds[7]);
let treemapLayout = d3.treemap().size([680, 350]).padding(1);
let barSvg;
const labelMapping = {
    "Sum_of_Survived": "Sum of Survived",
    "Sum_of_Deaths": "Sum of Deaths",
};
// Define visualization functions
function visualization1(data) {

const margin = { top: 20, right: 20, bottom: 30, left: 40 },
        barWidth = 1200 - margin.left - margin.right,
        barHeight = 350 - margin.top - margin.bottom;
       

    barSvg = d3.select("#visualization1")
        .attr('class', 'bar')
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const tooltip = d3.select(".viz-1 .tooltip");
    //console.log(tooltip)
   let aggregatedData = {};
    /* data.forEach(d => {
        if (!aggregatedData[d.Year]) {
            aggregatedData[d.Year] = { Year: d.Year, Sum_of_Ground: 0, Sum_of_Fatalities_air: 0, Sum_of_Aboard: 0 };
        }
        aggregatedData[d.Year].Sum_of_Ground += +d.Sum_of_Ground;
        aggregatedData[d.Year].Sum_of_Fatalities_air += +d.Sum_of_Fatalities_air;
        aggregatedData[d.Year].Sum_of_Aboard += +d.Sum_of_Aboard;
        debugger;
    });*/
    data.forEach(d => {
    if (!aggregatedData[d.Year]) {
        aggregatedData[d.Year] = {
            Year: d.Year,
            Sum_of_Survived: 0,
            Sum_of_Deaths: 0
        };
    }
    const fatalities = +d.Sum_of_Fatalities_air;
    const aboard = +d.Sum_of_Aboard;
    const ground = +d.Sum_of_Ground;

    aggregatedData[d.Year].Sum_of_Survived += Math.max(0,(aboard - fatalities));
    aggregatedData[d.Year].Sum_of_Deaths += fatalities;/*fatalities + ground*/

    //console.log(`Survived :${aggregatedData[d.Year].Sum_of_Survived} in year ${d.year}`);
    //console.log(`Dead :${aggregatedData[d.Year].Sum_of_Deaths}`);
});

    let processedData = Object.values(aggregatedData);
    /*const subgroups = ["Sum_of_Ground", "Sum_of_Fatalities_air", "Sum_of_Aboard"];
    const color = d3.scaleOrdinal().domain(subgroups).range(['#18FFFF', '#0288D1', '#BF360C']);*/
    const subgroups = ["Sum_of_Survived", "Sum_of_Deaths"];
const color = d3.scaleOrdinal().domain(subgroups).range(['#0288D1', '#BF360C']);

    x = d3.scaleBand()
        .domain(processedData.map(d => d.Year))
        .range([0, barWidth])
        .padding(0.1);

        const xAxis = d3.axisBottom(x)
.tickSizeOuter(0)
.tickFormat((d, i) => i % 3 === 0 ? d : '');


        // Define the brush
const brush = d3.brushX()
    .extent([[0, 0], [barWidth, barHeight]])
    .on("end", brushed);

// Append the brush to the svg
barSvg.append("g")
    .attr("class", "brush")
    .call(brush);


        barSvg.append("g")
        .attr("transform", `translate(0,${barHeight})`)
        .call(xAxis)
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(-40)");

        barSvg.append("text")
    .attr("class", "brush-instruction")
    .attr("x", 200) 
    .attr("y", 70) 
    .attr("text-anchor", "middle")
    .style("position", "absolute")  
    .style("font-size", "14px") 
    .style("fill", "#666") 
    .text("Drag to create a brush for selected years");

    const y = d3.scaleLinear()
        /*.domain([0, d3.max(processedData, d => +d.Sum_of_Ground + +d.Sum_of_Fatalities_air + +d.Sum_of_Aboard)])*/
        .domain([0, d3.max(processedData, d => +d.Sum_of_Survived + +d.Sum_of_Deaths)])
        .range([barHeight, 0]);
    barSvg.append("g").call(d3.axisLeft(y).ticks(5));

    const stack = d3.stack()
        .keys(subgroups)
        .order(d3.stackOrderNone)
        .offset(d3.stackOffsetNone);

    const stackedData = stack(processedData);

    /*barSvg.append('g')
    .attr('class', 'grid')
    .call(d3.axisLeft(y).tickSize(-barWidth))*/
    barSvg.append("g")
        .attr("class", "grid")
        .call(d3.axisLeft(y)
            .tickSize(-barWidth)
            .tickFormat("")); // Empty tick format to remove tick labels

    const bars = barSvg.append("g")
        .selectAll("g")
        .data(stackedData)
        .enter().append("g")
          .attr("fill", d => color(d.key))
          .attr("class", d => "Sum_of_" + d.key.replace("Sum_of_", "").toLowerCase())
          .selectAll("rect")
          .data(d => d)
          .enter().append("rect")
         // .attr("class", d => "bar-" + d.data.key.replace("Sum_of_", "").toLowerCase())
            .attr("x", d => x(d.data.Year))
            .attr("width", x.bandwidth())
            .attr("y", d => y(d[1])) // Initial y position
            .attr("height", 0)
            /*.each(function(d) { console.log("Bar data:", d); });*/

    // Animation with transition
    bars.transition()
        .duration(1600) // Duration of the animation in milliseconds
        .attr("y", d => y(d[1])) // Final y position
        .attr("height", d => {
    const barHeight = y(d[0]) - y(d[1]);
    //console.log("Bar height:", barHeight, "Data:", d);
    return barHeight;
})
        .on("end", function() {
            // Add interactivity after transition finishes
            d3.select(this)
              .on("mouseover", function(event, d) {
                  const key = d3.select(this.parentNode).datum().key;
                  const value = d.data[key];
                  const displayKey = labelMapping[key];
                  tooltip
                    .style("opacity", 1)
                    .html(`Year: ${d.data.Year}<br>${displayKey}: ${value}`)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 10) + "px");
              })
              .on("mouseout", function() {
                  tooltip.style("opacity", 0);
              });
        });
    
       /* barSvg.append("text")
.attr("x", function(d) { return x(d) - 3; })
.attr("y", barHeight / 2)
.attr("dy", ".35em")
.text(function(d) { return d; });*/

     
}

function visualization2(data) {
//let totalGround = 0, totalFatalities = 0, totalAboard = 0;
let totalSurvived = 0, totalDeaths = 0;

// Define legend dimensions and positioning
const legendRectSize = 15;
const legendSpacing = 3;
const legendHorizontal = 30; // Spacing between legends horizontally

let currentX = 0;


/*data.forEach(d => {
    totalGround += +d.Sum_of_Ground;
    totalFatalities += +d.Sum_of_Fatalities_air;
    totalAboard += +d.Sum_of_Aboard;
});

const pieData = [
    { name: 'Sum of Ground', value: totalGround, color: '#18FFFF' },
    { name: 'Sum of Fatalities air', value: totalFatalities, color: '#0288D1' },
    { name: 'Sum of Aboard', value: totalAboard, color: '#BF360C' }
];*/

data.forEach(d => {
    const fatalities = +d.Sum_of_Fatalities_air;
    const aboard = +d.Sum_of_Aboard;
    const ground = +d.Sum_of_Ground;

    totalSurvived += aboard - fatalities;
    totalDeaths += fatalities + ground;
});

const pieData = [
    { name: 'Sum of Survived', value: totalSurvived, color: '#0288D1' },
    { name: 'Sum of Deaths', value: totalDeaths, color: '#BF360C' }
];

// Pie chart setup
const viewWidth = 330,
      viewHeight = 330,
      svgWidth = viewHeight,
      svgHeight = viewHeight,
      thickness = 50,
      radius = Math.min(svgWidth, svgHeight) / 2,
      color = d3.scaleOrdinal()
                .range(pieData.map(k => k.color));

//const legendWidth = viewWidth; 

const svg = d3.select("#visualization2")
    .attr('viewBox', `0 0 ${viewWidth + thickness} ${viewHeight + thickness}`)
    .attr('class', 'pie')
    .attr('width', viewWidth)
    .attr('height', svgHeight);

const g = svg.append('g')
    .attr('transform', `translate( ${ (svgWidth / 2) + (thickness / 2) }, ${ (svgHeight / 2) + (thickness / 2)})`);

const arc = d3.arc()
    .innerRadius(radius - thickness)
    .outerRadius(radius);

const pie = d3.pie()
    .value(function(pieData) { return pieData.value; })
    .sort(null);

const paths = g.selectAll('path')
    .data(pie(pieData))
    .enter().append('path')
    .attr('fill', d => color(d.data.name))
    .attr('class', 'data-path');


// Create the legend group below the pie chart
const legend = svg.selectAll('.legend')
.data(pieData)
.enter()
.append('g')
.attr('class', 'legend')
.attr('transform', (d, i) => {
    const result = `translate(${currentX+80}, ${svgHeight - legendRectSize + 50})`;
    currentX += legendHorizontal + getTextWidth(d.name, "12px sans-serif") + legendRectSize + legendSpacing;
    return result;
});

//console.log(currentX);

// Draw legend rectangles
legend.append('rect')
.attr('width', legendRectSize)
.attr('height', legendRectSize)
.style('fill', d => d.color)
.style('stroke', d => d.color)
.attr('x', 0)
.attr('y', 0);

// Draw legend text
legend.append('text')
.attr('x', legendRectSize + legendSpacing)
.attr('y', legendRectSize / 2)
.text(d => d.name)
.attr("font-size", "12px")
.attr("font-weight", "600")
.attr("alignment-baseline","middle");





// Animate the pie slices
paths.transition()
    .duration(1000)
    .attrTween('d', function(d) {
        const i = d3.interpolate(d.startAngle+0.1, d.endAngle);
        return function(t) {
            d.endAngle = i(t); 
            return arc(d)
        }
    });

// Mouseover and mouseout events
paths.on('mouseover', function(event, d) {
    const path = d3.select(this);
    path.transition()
        .duration(250)
        .attr('d', d3.arc().innerRadius(radius - thickness).outerRadius(radius + 10));

    g.selectAll(".data-text__value, .data-text__name").remove();

    g.append('text')
        .text(`${d.data.value.toLocaleString()}`)
        .attr('class', 'data-text data-text__value data-text--show')
        .attr('text-anchor', 'middle')
        .attr('dy', '-1rem');

    g.append('text')
        .text(`${d.data.name}`)
        .attr('class', 'data-text data-text__name data-text--show')
        .attr('text-anchor', 'middle')
        .attr('dy', '1.5rem');
        /*const categoryName = d.data.name.replace("Sum of ", "Sum_of_");
        highlightBar(categoryName);*/
        const categoryName = "Sum_of_" + d.data.name.replace("Sum of ", "").replace(" ", "_").toLowerCase();
        highlightBar(categoryName);
})
.on('mouseout', function() {
    d3.select(this).transition()
        .duration(250)
        .attr('d', arc);

    g.selectAll(".data-text__value, .data-text__name").remove();
    removeHighlight();
});
}


function visualization3(data) {
const width = 930, height = 380;

const svg = d3.select("#visualization3")
    .attr('class', 'geomap')
    .attr("width", width)
    .attr("height", height);

  

const projection = d3.geoMercator()
    .scale(130)
    .center([0, 30])
    .translate([width / 2, height / 2]);

const path = d3.geoPath().projection(projection);

const crashCounts = new Map();
data.forEach(d => {
    crashCounts.set(d['Country/Region'], (crashCounts.get(d['Country/Region']) || 0) + 1);
});
    

const tooltip = d3.select(".viz-3").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

let centered;

const zoom = d3.zoom()
    .scaleExtent([1, 8])
    .on('zoom', (event) => {
        map.attr('transform', event.transform);
    });

const map = svg.append('g')
    .call(zoom); // Apply the zoom behavior here

    const legend = svg.append("g")
  .attr("id", "legend")
  .attr("transform", "translate(50,180)"); // Adjust position as needed

const legendItemHeight = 20;
const legendItemWidth = 20;

// Add legend title
legend.append("text")
  .attr("class", "legend-title")
  .attr("y", -10)
  .attr("x", -legendItemHeight / 2)
  .style("text-anchor", "start")
  .text("Crashes");

// Add legend items
const legendItem = legend.selectAll(".legend-item")
  .data(colorScale.range().map(function(color, index) {
      if (index === 0) return null; // Skip the first entry
      const d = colorScale.invertExtent(color);
      if (index === 1) return [0, d[1]]; // Start from 0 for the first entry
      return d;
  }).filter(Boolean)) // Filter out null values
  .enter().append("g")
  .attr("class", "legend-item")
  .attr("transform", (d, i) => `translate(0, ${i * legendItemHeight})`);

legendItem.append("rect")
  .attr("width", legendItemWidth)
  .attr("height", legendItemHeight)
  .attr("fill", d => colorScale(d[0]));

legendItem.append("text")
  .attr("x", legendItemWidth + 5)
  .attr("y", legendItemHeight / 2)
  .attr("dy", "0.35em")
  .text((d, i) => {
// Check if this is the last item in the legend
if (i === colorScale.range().length - 2) { 
  return `${d[0]} - ${d[1]}+`; 
} else {
  return `${d[0]} - ${d[1]}`;
}
});
d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson").then(function (topo) {

    const countries = map.selectAll("path")
        .data(topo.features)
        .join("path")
        // Draw each country
        .attr("d", path)
        // Set the color
        .attr("fill", "#ccc")
        /*.attr("fill", function (d) {
            const crashes = crashCounts.get(d.properties.name) || 0;
            return colorScale(crashes);
        })*/
        // Add a class and a click event to each country
        .attr("class", "country")
        .on("click", clicked)
        .on("mouseover", function(event, d) {
            const crashes = crashCounts.get(d.properties.name) || 0;
            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            tooltip.html("Country: " + d.properties.name + "<br>Crashes: " + crashes)
                .style("left", (event.pageX) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function() {
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        });
        countries.transition()
.duration(1000)
.attr("fill", function(d) {
    // Assuming crashCounts is a map of country names to crash counts
    const crashes = crashCounts.get(d.properties.name) || 0;
    return colorScale(crashes); // transition to the actual color based on crash count
});

    map.selectAll("text")
        .data(topo.features)
        .enter().append("text")
        .attr("transform", function(d) { 
            return "translate(" + path.centroid(d) + ")"; 
        })
        .attr("dy", ".35em")
        .text(function(d) {
            const crashes = crashCounts.get(d.properties.name) || 0;
            return crashes > 0 ? crashes : '';
        })
        .attr("fill", "white");
        

    function clicked(event, d) {
        const country = d3.select(this);
        const isSelected = country.classed("selected");
        countries.classed("selected", false); // Remove selection from all countries
        country.classed("selected", !isSelected); // Toggle the selection

        const [[x0, y0], [x1, y1]] = path.bounds(d);
        event.stopPropagation();
        centered = centered !== d && !isSelected ? d : null;
        map.selectAll('.country').classed('active', centered && function(d) { return d === centered; });

        map.transition()
            .duration(750)
            .attr("transform", centered ? `translate(${width / 2},${height / 2})scale(4)translate(${-x0 - (x1 - x0) / 2},${-y0 - (y1 - y0) / 2})` : `translate(0,0)scale(1)`);
    }

    svg.on("click", () => {
        countries.classed("selected", false);
        if (centered) {
            map.transition()
                .duration(750)
                .attr("transform", `translate(0,0)scale(1)`);
            centered = null;
        }
    });
}).catch(function (error) {
    console.error("Error loading GeoJSON: ", error);
});
}

function visualization4(data) {

updateVisualization4(data); 


}


function updateVisualization4(data) {
// Process data
var groupedData = d3.rollup(data, v => v.length, d => d['Aircraft']);
var sortedData = Array.from(groupedData).sort((a, b) => b[1] - a[1]).slice(0, 10);
//console.log("Sorted Data:", sortedData);
var hierarchyData = { name: "Crashes", children: sortedData.map(d => ({ name: d[0], value: d[1] })) };
var root = d3.hierarchy(hierarchyData).sum(d => d.value).sort((a, b) => b.value - a.value);
d3.treemap().size([680, 350]).padding(1)(root);
//console.log("Hierarchy Leaves:", root.leaves());

const tooltip =  d3.select(".viz-4 .tooltip")
.attr("id", "treemap-tooltip")
.style("opacity", 0)
.style("position", "absolute")
.style("pointer-events", "none")
.style("background", "#b0c4de")
.style("padding", "5px")
.style("border-radius", "8px")
.style("text-align", "center");

// Apply the treemap layout
//treemapLayout(root);


colorScale4.domain([0, d3.max(sortedData, d => d[1])]);


const svg = d3.select("#visualization4")
.attr('class', 'treenode')
.attr("width", 680)
.attr("height", 400)
.selectAll("g").data(root.leaves());


const nodesEnter = svg.enter().append("g")
.attr("transform", d => `translate(${d.x0},${d.y0})`);
//console.log("Nodes entering:", nodesEnter.size());

nodesEnter.append("rect")
    .attr("width", d => d.x1 - d.x0)
   // .attr("height", 0) // Start with height 0
.attr("fill", d => colorScale4(d.data.value))
.transition()
.duration(1000)
.attr("height", d => d.y1 - d.y0); // Animate to full height


nodesEnter.append("text")
    .attr("x", 5)
    .attr("y", 20)
    .text(d => d.data.name)
    .attr("font-size", "14px")
    .attr("fill", "white");


    nodesEnter
.on("mouseover", function(event, d) {
    tooltip.transition()
        .duration(200)
        .style("opacity", .9);
    tooltip.html("Aircraft: " + d.data.name + "<br/>Crashes: " + d.data.value)
        .style("left", (event.pageX) + "px")
        .style("top", (event.pageY - 28) + "px");
})
.on("mouseout", function(d) {
    tooltip.transition()
        .duration(500)
        .style("opacity", 0);
});


// Update existing elements
svg.select("rect")
    .transition()
    .duration(500)
    .attr("width", d => d.x1 - d.x0)
    .attr("height", d => d.y1 - d.y0)
    .attr("fill", d => colorScale4(d.data.value));

svg.select("text")
    .transition()
    .duration(500)
    .attr("x", 5)
    .attr("y", 20)
    
    .text(d => d.data.name);

// Remove old elements
svg.exit().remove();
}




function brushed(event) {

if (event.selection) {
    const [x0, x1] = event.selection;
    const brushedYears = x.domain().filter(d => {
        const xValue = x(d) + x.bandwidth() / 2; // center of the bar
        return xValue >= x0 && xValue <= x1;
    });

    const filteredData = fullData.filter(d => brushedYears.includes(d.Year));
   // debugger
   //console.log(filteredData)
    // Call functions to update other visualizations with filteredData
    document.getElementById("visualization2").innerHTML=""
    document.getElementById("visualization3").innerHTML=""
    document.getElementById("visualization4").innerHTML=""
    //console.log(document.getElementById("visualization1").innerHTML)
    updateVisualizations(filteredData);
}
else {
    // If the brush is cleared, use the full dataset
    document.getElementById("visualization2").innerHTML=""
    document.getElementById("visualization3").innerHTML=""
    document.getElementById("visualization4").innerHTML=""
    updateVisualizations(fullData);
}
}

// Update all visualizations based on the brushed data or full data
function updateVisualizations(data) {
visualization2(data); // Update visualization 2 with new data
visualization3(data); // Update visualization 3 with new data
updateVisualization4(data);//visualization4(data); // Update visualization 4 with new data
}

function clearSVG(){

}

function highlightBar(categoryName) {
//console.log("Highlighting:", categoryName);

// Reset the opacity for all bars first
barSvg.selectAll("g rect")
    .style("opacity", 0.2);

// Now highlight only the bars that match the category
barSvg.selectAll("." + categoryName + " rect")
    .style("opacity", 1);
}

function removeHighlight() {
// Reset opacity for all bars
barSvg.selectAll("g rect")
    .style("opacity", 1);
}

// Function to estimate text width (same as before)
function getTextWidth(text, font) {
// re-use canvas object for better performance
const canvas = getTextWidth.canvas || (getTextWidth.canvas = document.createElement("canvas"));
const context = canvas.getContext("2d");
context.font = font;
const metrics = context.measureText(text);
return metrics.width;
}
function getBrightness(d) {
// This is a simple brightness checker that can be replaced by more complex algorithms
const rgb = d3.rgb(colorScale(d));
return (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
}

// Load data and call visualization functions
d3.csv("dataset/aircrashFdata.csv").then(data => {
fullData = data; // Store the loaded data
visualization1(fullData); // Initialize visualization 1 with full data
updateVisualizations(fullData); // Initialize other visualizations with full data
//visualization1(data);
//visualization2(data);
// Call other visualization functions
//visualization3(data);
//visualization4(data);
}).catch(error => {
console.error("Error loading the data: ", error);
});