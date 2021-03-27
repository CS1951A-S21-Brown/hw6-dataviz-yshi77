// Add your JavaScript code here
const MAX_WIDTH = Math.max(1080, window.innerWidth);
const MAX_HEIGHT = 720;
const margin = {top: 40, right: 100, bottom: 40, left: 175};

// Assumes the same graph width, height dimensions as the example dashboard. Feel free to change these if you'd like
let graph_1_width = (MAX_WIDTH / 2) - 10, graph_1_height = 250;
let graph_2_width = (MAX_WIDTH / 2) - 10, graph_2_height = 275;
let graph_3_width = MAX_WIDTH / 2, graph_3_height = 575;
let NUM_EXAMPLES = 10;
let svg1 = d3.select("#graph1")
    .append("svg")
    .attr("width", graph_1_width)  
    .attr("height", graph_1_height) 
    .append("g")
    .attr("transform", `translate(${margin.left+ 18}, ${margin.top})`);

let svg2 = d3.select("#graph2")
    .append("svg")
    .attr("width", graph_2_width)  
    .attr("height", graph_2_height) 
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

function produceGraph1() {
    let  tooltip = d3.select("#graph1")
        .append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("z-index", 10)
        .style("visibility", "visible")
        .text("Simple text");
    let x = d3.scaleLinear()
    .range([0, graph_1_width - margin.left - margin.right]);
    let y = d3.scaleBand()
        .range([0, graph_1_height - margin.top - margin.bottom])
        .padding(0.1); 

    let countRef = svg1.append("g");
    let y_axis_label = svg1.append("g");

    svg1.append("text")
        .attr("transform", `translate(${(graph_1_width-margin.left-margin.right)/2}, ${graph_1_height-margin.bottom})`) 
        .style("text-anchor", "middle");

    let y_axis_text = svg1.append("text")
        .attr("transform", `translate(${20-margin.left}, ${(graph_1_height-margin.top-margin.bottom)/2})`) 
        .style("text-anchor", "middle");

    let title = svg1.append("text")
        .attr("transform", `translate(${(graph_1_width-margin.left-margin.right)/2}, ${-20})`)  
        .style("text-anchor", "middle")
        .style("font-size", 15);
    title.text("Global Sales (in millions) for the Top 10 video games of all time");
    
    d3.csv("data/video_games.csv").then(function(data) {
        data = cleanData(data, function(a,b){return b.Global_Sales-a.Global_Sales}, NUM_EXAMPLES);

        x.domain([0, d3.max(data, d => d.Global_Sales)]);
        y.domain(data.map(function(item){return item.Name}));
        
        y_axis_label.call(d3.axisLeft(y).tickSize(0).tickPadding(10));

        let color = d3.scaleOrdinal()
            .domain(data.map(function(d) { return d[0] }))
            .range(d3.quantize(d3.interpolateHcl("#66a0e2", "#81c2c3"), NUM_EXAMPLES));

        let bars = svg1.selectAll("rect").data(data);
        bars.enter()
            .append("rect")
            .merge(bars)
            .attr("fill", function(d) { return color(d['Name']) })
            .transition()
            .duration(1000)
            .attr("x", x(0))
            .attr("y", function(d){return y(d["Name"])})              
            .attr("width", function(d) { 
                return x(parseInt(d.Global_Sales));
            })
            .attr("height",  y.bandwidth())
            .text(function(d){return d.Global_Sales;})

        y.domain(data.map(function(item){return item.Name}));
        
        let counts = countRef.selectAll("text").data(data);

        counts.enter()
            .append("text")
            .merge(counts)
            .transition()
            .duration(1000)
            .attr("x", function(d){return x(parseInt(d.Global_Sales)+5)})      
            .attr("y", function(d){return y(d["Name"])+15;})      
            .style("text-anchor", "start")
            .text(function(d){return d.Global_Sales});          
        y_axis_text.attr("transform", "translate(-150, 100)").text("Names");
        
        bars.exit().remove();
        counts.exit().remove();
    });
}

function cleanData(data, comparator, numExamples) {
    data = data.slice(0, numExamples);
    return data;
}
function produceGraph2() {
    svg2.append("text")
        .attr("transform", `translate(${(graph_2_width-margin.left-margin.right)/2}, ${graph_2_height-margin.bottom-10})`) 
        .style("text-anchor", "middle")
        .text("Genres Sales (in millions) for different Regions");
    let y_axis_text2 = svg2.append("text")
        .style("text-anchor", "middle")
        .attr("transform", "translate(-80, 100)").text("Sales (in millions)");
    d3.csv("data/video_games.csv").then(function(data){
        let subgroups = d3.map(data, function(d){return(d.Genre)}).keys();
        let groups = ["NA_Sales","EU_Sales","JP_Sales","Other_Sales"];
        let cntMap = new Map();
        for (gg in groups){
            cntMap[groups[gg]] = [];
        }
        
        for (y in subgroups){
            temp = data.filter(function(d){ return d.Genre == subgroups[y]});
            cntMap["NA_Sales"][y] = {grpName : subgroups[y], grpValue : d3.sum(temp, d => d.NA_Sales)}; 
            cntMap["EU_Sales"][y] = {grpName : subgroups[y], grpValue : d3.sum(temp, d => d.EU_Sales)};
            cntMap["JP_Sales"][y] = {grpName : subgroups[y], grpValue : d3.sum(temp, d => d.JP_Sales)};
            cntMap["Other_Sales"][y] = {grpName : subgroups[y], grpValue : d3.sum(temp, d => d.Other_Sales)};
        }
        
        let li = [];
        for (k in cntMap){
            li.push({key: k, values: cntMap[k]});
        }
        drawBarChart(li);
        // Going from wide to long format
        var tdata = [];
        header = ["group"];
        for (var x in subgroups){
            header.push(subgroups[x]);
        }
        tdata.push([header]);
        for (var x in groups){
            row = [groups[x]].concat(cntMap[groups[x]]);
            tdata.push(row)
        }        
    });
}

function drawBarChart(groupData0){
        let groupData = groupData0;
        width = graph_2_width - margin.left - margin.right,
        height = graph_2_height - margin.top - margin.bottom;

        var x0  = d3.scaleBand().rangeRound([0, width], .5);
        var x1  = d3.scaleBand();
        var y   = d3.scaleLinear().rangeRound([height, 0]);

        var xAxis = d3.axisBottom().scale(x0).tickValues(groupData.map(d=>d.key));
        var yAxis = d3.axisLeft().scale(y);
        const color = d3.scaleOrdinal(d3.schemeCategory10);

        var categoriesNames = groupData.map(function(d) { return d.key; });
        var rateNames       = groupData[0].values.map(function(d) { return d.grpName; });

        x0.domain(categoriesNames);
        x1.domain(rateNames).rangeRound([0, x0.bandwidth()]);
        y.domain([0, d3.max(groupData, function(key) { return d3.max(key.values, function(d) { return d.grpValue; }); })]);

        svg2.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);


        svg2.append("g")
            .attr("class", "y axis")
            .style('opacity','0')
            .call(yAxis)
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 6)
            .attr("dy", ".71em")
            .style("text-anchor", "end")
            .style('font-weight','bold')
            .text("Value");

        svg2.select('.y').transition().duration(500).delay(1300).style('opacity','1');

        var slice = svg2.selectAll(".slice")
            .data(groupData)
            .enter().append("g")
            .attr("class", "g")
            .attr("transform",function(d) { return "translate(" + x0(d.key) + ",0)"; });
        
        let tooltip = d3.select("#graph2") 
                        .append("div")
                        .attr("class", "tooltip")
                        .style("opacity", 0);

        slice.selectAll("rect")
            .data(function(d) { return d.values; })
            .enter().append("rect")
            .attr("width", x1.bandwidth())
            .attr("x", function(d) { return x1(d.grpName); })
            .style("fill", function(d) { return color(d.grpName) })
            .attr("y", function(d) { return y(0); })
            .attr("height", function(d) { return height - y(0); })
            .on("mouseover", function(d) {
                d3.select(this).style("fill", d3.rgb(color(d.grpName)).darker(2));
                let color_span = `<span style="color:blue;font-weight:bold">`;
                let html = `Genre: ${color_span}${d.grpName}</span><br/>Reginal Sales: ${color_span}${d.grpValue.toFixed(2)} in millions</span>`; 
                tooltip.html(html)
                    .style("left", `${(d3.event.pageX) - 120}px`)
                    .style("top", `${(d3.event.pageY) - 30}px`)
                    .style("box-shadow", `2px 2px 5px ${color(d.grpName)}`)
                    .transition()
                    .duration(200)
                    .style("opacity", 0.9);
            })
            .on("mouseout", function(d) {
                d3.select(this).style("fill", color(d.grpName));
                tooltip.transition()
                    .duration(200)
                    .style("opacity", 0);
            });

        slice.selectAll("rect")
        .transition()
        .delay(function (d) {return Math.random()*1000;})
        .duration(1000)
        .attr("y", function(d) { return y(d.grpValue); })
        .attr("height", function(d) { return height - y(d.grpValue); });

        var legend = svg2.selectAll(".legend")
        .data(groupData[0].values.map(function(d) { return d.grpName; }).reverse())
        .enter().append("g")
        .attr("class", "legend")
        .attr("transform", function(d,i) { return "translate(0," + i * 12 + ")"; })
        .style("opacity","0");

        legend.append("rect")
        .attr("x", width - 18)
        .attr("width", 10)
        .attr("height", 10)
        .style("fill", function(d) { return color(d); });

        legend.append("text")
        .attr("x", width - 24)
        .attr("y", 6)
        .attr("dy", ".35em")
        .style("text-anchor", "end")
        .text(function(d) {return d; });

        legend.transition().duration(500).delay(function(d,i){ return 1300 + 100 * i; }).style("opacity","1");

}
function produceGraph3(y){
    var el = document.getElementById("graph3");
    while (el.firstChild) {
        el.removeChild(el.firstChild);
    }
    d3.csv("data/video_games.csv").then(function(data){
        let subgroups = d3.map(data, function(d){return(d.Genre)}).keys();
        var select = document.getElementById("select");
        for (var ii = 0; ii < subgroups.length; ii++){
            var option = document.createElement("OPTION");
            var txt = document.createTextNode(subgroups[ii]);
            option.appendChild(txt);
            option.setAttribute("value", ii);
            select.insertBefore(option, select.lastChild);
        }
        
        var details = [];
        let groups = d3.map(data, function(d){return(d.Publisher)}).keys();
        let cntMap = new Map();
        temp = data.filter(function(d){ return d.Genre == subgroups[y]});
        var filterRes;
        for (idx in groups){
            filterRes = temp.filter(function(el){
                return groups[idx] == el.Publisher;
            });
            var sum = d3.sum(filterRes, d => d.Global_Sales);
            sum = Math.round(sum * 100) / 100;
            var shortName = groups[idx];
            if (groups[idx].length > 22)
            {
                shortName = groups[idx].substring(0, 22) + "...";
            }
            details.push({Genre: shortName, number: sum, grpname: ""});
        }
        details = details.sort((a,b)=>b.number-a.number);
        var summ = 0.0;
        for (var ii = 0; ii < details.length; ii++){
            summ += details[ii]["number"];
        }
        for (var ii = 0; ii < details.length; ii++){
            
            details[ii]["number"] = Math.round(details[ii]["number"] / summ * 1000) / 10;
        }
        details = details.slice(0, 5);
        
        barchart(details);
    });
}
function barchart(details){
    let svg3 = d3.select("#graph3")
        .append("svg")
        .attr("width", graph_3_width)  
        .attr("height", graph_3_height) 
        .append("g")
        .attr("transform", `translate(${margin.left-80}, ${margin.top-80})`)
        .attr("background", "pink");    
    svg3.selectAll("path.d").remove();
    var width = graph_3_width;
    var height = graph_3_height;
    var colors = d3.scaleOrdinal(d3.schemeDark2);
    var data = d3.pie().sort(null).value(function(d){return d.number;})(details);

    var segments = d3.arc()
                    .innerRadius(0)
                    .outerRadius(130)
                    .padAngle(.05)
                    .padRadius(50);
    var sections = svg3.append("g")
                    .attr("transform", `translate(${(graph_3_width-margin.left-margin.right)/2},${(graph_3_height-margin.top-margin.bottom)/2})`)
                    .selectAll("path")
                    .data(data)
    sections.enter()
            .append("path")
            .attr("d", segments)
            .attr("fill",function(d){return colors(d.data.number)});
    var content = svg3.selectAll("text")
                    .data(data)
                    .enter()
                    .append("text")
                    .attr("transform", `translate(${(graph_3_width-margin.left-margin.right)/2},${(graph_3_height-margin.top-margin.bottom)/2})`)
                    .each(function(d){
                        var center = segments.centroid(d);
                        d3.select(this)
                                    .attr("x",center[0]-10)
                                    .attr("y",center[1]+20)
                                    .text(d.data.number);
                    })
    var legends = svg3.append("g")
                .attr("transform", `translate(${(graph_3_width-margin.left-margin.right)},${(graph_3_height-margin.top-margin.bottom)/2})`)
                .selectAll(".legends")
                .data(data);
    var legend = legends
        .enter()
        .append("g")
        .classed("Legends",true)
        .attr("transform", function(d, i){return "translate(0,"+(i+1)*21+")";});
    legend.append("rect").attr("width", 20)
                         .attr("height",20)
                         .attr("fill",function(d){return colors(d.data.number)});
    legend.append("text").text(function(d){return d.data.Genre;})
                         .attr("fill",function(d){return colors(d.data.number)})
                         .attr("x",20)
                         .attr("y",20);
    svg3.append("text").attr("transform", `translate(${(graph_3_width-margin.left-margin.right)/2+30}, ${margin.top+ 30})`)       // HINT: Place this at the bottom middle edge of the graph
                         .style("text-anchor", "middle")
                         .text("Percentage of Global Sales of the Top Five Publishers");
}
// On page load, render the graph
produceGraph1();
produceGraph2();
produceGraph3(0);
