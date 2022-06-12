window.addEventListener('load', function () {
    map_viz()
    scatter_viz()
    bar_viz()
})

function map_viz() {
    // The svg
    let mapa = d3.select("#mapa"),
        width = +mapa.attr("width"),
        height = +mapa.attr("height");

    // Map and projection
    let projection = d3.geoNaturalEarth1()
        .scale(120)
        .center([10, 12])
        .translate([width / 2, height / 2])

    d3.queue()
        .defer(d3.json, "./data/world.geojson")
        .defer(d3.json, "./data/dataset.json")
        .await(data_ready);

    function data_ready(error, world_map, dataset) {
        if (error) {
            console.error("Error loading data:", error)
            return
        }
        // Remove the Antartica (we know is at position 6)
        world_map.features.splice(6, 1)

        console.log("Draw map", world_map)
        console.log("Data", dataset)

        // Find max and min values
        let max_gdp = -Number.MAX_VALUE
        let min_gdp = Number.MAX_VALUE
        let max_total_deaths = -Number.MAX_VALUE
        let min_total_deaths = Number.MAX_VALUE

        let year_obj = dataset[current_year]
        for (let country in year_obj) {
            let country_obj = year_obj[country]
            if (country_obj['GDP'] > max_gdp) {
                max_gdp = country_obj['GDP']
            }
            if (country_obj['GDP'] < min_gdp) {
                min_gdp = country_obj['GDP']
            }
            if (country_obj['Air pollution (total) (deaths per 100,000)'] > max_total_deaths) {
                max_total_deaths = country_obj['Air pollution (total) (deaths per 100,000)']
            }
            if (country_obj['Air pollution (total) (deaths per 100,000)'] < min_total_deaths) {
                min_total_deaths = country_obj['Air pollution (total) (deaths per 100,000)']
            }
        }

        console.log("Any " + current_year)
        console.log("Max GDP = ", max_gdp)
        console.log("Min GDP = ", min_gdp)
        console.log("Max Total Deaths = ", max_total_deaths)
        console.log("Min Total Deaths = ", min_total_deaths)

        var gdp_color_scale = d3.scaleLinear()
            .domain([min_gdp, max_gdp])
            .range(["white", "#126ad2"])
        
        let deaths_color_scale = d3.scaleLinear()
            .domain([min_total_deaths, max_total_deaths])
            .range(["white", "red"])

        // Clear SVG
        d3.selectAll("#mapa > *").remove()

        // Draw legend
        let square_size = 12
        let init_x = 40
        let init_y = 250

        d3.range(0, 4).forEach(function(y) {
            d3.range(0, 4).forEach(function(x) {
                let gdp_val = f_val(max_gdp, min_gdp, x)
                let deaths_val = f_val(max_total_deaths, min_total_deaths, y)
                let color = interp_color(gdp_val, deaths_val, max_gdp, min_gdp, max_total_deaths, min_total_deaths)
                mapa.append('rect')
                    .attr('x', init_x + x*square_size)
                    .attr('y', init_y - y*square_size)
                    .attr('width', square_size)
                    .attr('height', square_size)
                    .attr('fill', color);
            });
        });

        mapa.append('text')
            .style("font-size", "8px")
            .style("font-family", "Monaco")
            .attr('transform', 'rotate(-90) translate(-262, 30)')
            .text("Morts ->")

        mapa.append('text')
            .style("font-size", "8px")
            .style("font-family", "Monaco")
            .attr('transform', 'translate(42, 278)')
            .text("Riquesa ->")
        
        // Draw the map
        mapa.append("g")
            .selectAll("path")
            .data(world_map.features)
            .enter().append("path")
                .attr("fill", function (d) {
                    let country_code = d['id']
                    if (dataset[current_year + ''][country_code] != undefined) {
                        let gdp_value = dataset[current_year + ''][country_code]['GDP']
                        let deaths_value = dataset[current_year + ''][country_code]['Air pollution (total) (deaths per 100,000)'] 
                        return interp_color(gdp_value, deaths_value, max_gdp, min_gdp, max_total_deaths, min_total_deaths)
                    }
                    else {
                        return "grey"
                    }
                })
                .attr("d", d3.geoPath()
                    .projection(projection)
                )
                .style("stroke", "black")
    }
}

function interp_color(gdp, death, max_gdp, min_gdp, max_deaths, min_death) {
    let size = 10

    // X -> GDP 
    let gdp_scale = d3.scaleLinear()
      .domain([min_gdp, max_gdp])
      .range(['white', '#126ad2'])
    
    // Y -> Deaths
    let death_scale = d3.scaleLinear()
      .domain([min_death, max_deaths])
      .range(['white', 'red'])

    let color = d3.scaleLinear()
      .domain([-1,1])
      .range([gdp_scale(gdp), death_scale(death)])
      .interpolate(d3.interpolateLab)

    let prop_gdp = gdp / (max_gdp - min_gdp)
    let prop_deaths = death / (max_deaths - min_death)
    let y = size * prop_deaths
    let x = size * prop_gdp

    let strength = (y - x) / (size - 1)
            
    return color(strength)
}

function f_val(max, min, n) {
    return ((((max - min) / 3) * n) + min)
}

let current_year = 2004

function yearChange(self) {
    console.log("Year = ", self.value)
    current_year = self.value
    document.getElementById("any").textContent = "Any " + current_year
    map_viz()
}

function scatter_viz() {
    // The svg
    let scatter = d3.select("#scatter"),
        width = +scatter.attr("width"),
        height = +scatter.attr("height");

    // Clear SVG
    d3.selectAll("#scatter > *").remove()

    d3.csv("data/mean_all_years.csv", function(data) {
        console.log("Scatter data", data)

        // Add X axis
        let x = d3.scaleLinear()
            .domain([0, 80000])
            .range([30, width - 20 ])
        
        scatter.append("g")
            .attr("transform", "translate(0," + (height - 35) + ")")
            .call(d3.axisBottom(x).ticks(5));

        scatter.append('text')
            .style("font-size", "11px")
            .style("font-family", "Monaco")
            .attr('transform', 'translate(580, 285)')
            .text("PIB")
        
        // Add Y axis
        let y = d3.scaleLinear()
            .domain([0, 300])
            .range([ height - 35, 10])
        
        scatter.append("g")
            .call(d3.axisLeft(y).ticks(4))
            .attr("transform", "translate(30,0)")

        scatter.append('text')
            .style("font-size", "11px")
            .style("font-family", "Monaco")
            .attr('transform', 'translate(40, 15)')
            .text("Morts")

        // Legend
        let legend_x = 470
        let legend_y = 16 
        scatter.append('text')
            .style("font-size", "11px")
            .style("font-family", "Monaco")
            .attr('transform', 'translate(' + legend_x + ', ' + legend_y +')')
            .text("Ingressos:")

        scatter.append('rect')
            .attr('x', legend_x)
            .attr('y', legend_y + 15)
            .attr('width', 20)
            .attr('height', 11)
            .attr('fill', "blue");

        scatter.append('text')
            .style("font-size", "11px")
            .style("font-family", "Monaco")
            .attr('transform', 'translate(' + (legend_x + 30) + ', ' + (legend_y + 25) +')')
            .text("Alt")

        scatter.append('rect')
            .attr('x', legend_x)
            .attr('y', legend_y + 30)
            .attr('width', 20)
            .attr('height', 11)
            .attr('fill', "green");

        scatter.append('text')
            .style("font-size", "11px")
            .style("font-family", "Monaco")
            .attr('transform', 'translate(' + (legend_x + 30) + ', ' + (legend_y + 40) +')')
            .text("Mig-Alt")

        scatter.append('rect')
            .attr('x', legend_x)
            .attr('y', legend_y + 45)
            .attr('width', 20)
            .attr('height', 11)
            .attr('fill', "orange");

        scatter.append('text')
            .style("font-size", "11px")
            .style("font-family", "Monaco")
            .attr('transform', 'translate(' + (legend_x + 30) + ', ' + (legend_y + 55) +')')
            .text("Mig-Baix")

        scatter.append('rect')
            .attr('x', legend_x)
            .attr('y', legend_y + 60)
            .attr('width', 20)
            .attr('height', 11)
            .attr('fill', "red");

        scatter.append('text')
            .style("font-size", "11px")
            .style("font-family", "Monaco")
            .attr('transform', 'translate(' + (legend_x + 30) + ', ' + (legend_y + 70) +')')
            .text("Baix")
        
        // Add dots
        scatter.append('g')
            .selectAll("dot")
            .data(data)
            .enter()
            .append("circle")
            .attr("cx", function(d) { return x(d["GDP"]); } )
            .attr("cy", function(d) { return y(d["Air pollution (total) (deaths per 100,000)"]); } )
            .attr("r", 3)
            .attr("transform", "translate(5, 8)")
            .style("fill", function(d) {
                if (d['IncomeGroup'] == 'Low income') {
                    return "red"
                }
                else if (d['IncomeGroup'] == 'Lower middle income') {
                    return "orange"
                }
                else if (d['IncomeGroup'] == 'Upper middle income') {
                    return "green"
                }
                else if (d['IncomeGroup'] == 'High income') {
                    return "blue"
                }
                else {
                    return "gray"
                }
            })
    })
}

function bar_viz() {
    // The svg
    let bar = d3.select("#bar"),
        width = +bar.attr("width"),
        height = +bar.attr("height");

    let top_margin = 40
    height -= top_margin
    // Clear SVG
    d3.selectAll("#bar > *").remove()

    d3.csv("data/under_50.csv", function(data) {
        console.log("Bar data", data)

        // X axis
        let x = d3.scaleBand()
            .range([ 0, width ])
            .domain(data.map(function(d) { return d["IncomeGroup"]; }))
            .padding(0.5);

        // Add Y axis
        let y = d3.scaleLinear()
            .domain([0, 50])
            .range([ height - 5, 0]);

        bar.append("g")
            .call(d3.axisLeft(y).ticks(5))
            .attr("transform", "translate(30, 5)");

        bar.append('text')
            .style("font-size", "11px")
            .style("font-family", "Monaco")
            .attr('transform', 'translate(42, 10)')
            .text("Morts")

        bar.append('text')
            .style("font-size", "11px")
            .style("font-family", "Monaco")
            .attr('transform', 'translate(150, 350)')
            .text("Ingressos")
        bar.append('text')
            .style("font-size", "11px")
            .style("font-family", "Monaco")
            .attr('transform', 'translate(166, 365)')
            .text("Alts")

        bar.append('text')
            .style("font-size", "11px")
            .style("font-family", "Monaco")
            .attr('transform', 'translate(390, 350)')
            .text("Ingressos")
        bar.append('text')
            .style("font-size", "11px")
            .style("font-family", "Monaco")
            .attr('transform', 'translate(394, 365)')
            .text("Mig-Alts")

        // Bars
        bar.selectAll("mybar")
            .data(data)
            .enter()
            .append("rect")
            .attr("x", function(d) { return x(d["IncomeGroup"]); })
            .attr("y", function(d) { return y(d["Air pollution (total) (deaths per 100,000)"]); })
            .attr("width", x.bandwidth())
            .attr("height", function(d) { return height - y(d["Air pollution (total) (deaths per 100,000)"]); })
            .attr("transform", "translate(0, 0)")
            .attr("fill", function(d) {
                if (d['IncomeGroup'] == 'Low income') {
                    return "red"
                }
                else if (d['IncomeGroup'] == 'Lower middle income') {
                    return "orange"
                }
                else if (d['IncomeGroup'] == 'Upper middle income') {
                    return "green"
                }
                else if (d['IncomeGroup'] == 'High income') {
                    return "blue"
                }
                else {
                    return "gray"
                }
            })
        })
}

function go_to_map() {
    document.getElementById('pantalla_0').style.display = "none"
    document.getElementById('pantalla_1').style.display = "inline-block"
    document.getElementById('pantalla_2').style.display = "none"
    document.getElementById('pantalla_3').style.display = "none"
}

function go_to_main() {
    document.getElementById('pantalla_0').style.display = "inline-block"
    document.getElementById('pantalla_1').style.display = "none"
    document.getElementById('pantalla_2').style.display = "none"
    document.getElementById('pantalla_3').style.display = "none"
}

function go_to_scatter() {
    document.getElementById('pantalla_0').style.display = "none"
    document.getElementById('pantalla_1').style.display = "none"
    document.getElementById('pantalla_2').style.display = "inline-block"
    document.getElementById('pantalla_3').style.display = "none"
}

function go_to_bars() {
    document.getElementById('pantalla_0').style.display = "none"
    document.getElementById('pantalla_1').style.display = "none"
    document.getElementById('pantalla_2').style.display = "none"
    document.getElementById('pantalla_3').style.display = "inline-block"
}