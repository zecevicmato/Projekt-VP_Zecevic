let year = 1980;
decade.textContent = year;
fetchData();
const yearSlider = document.getElementById("year-slider");
yearSlider.addEventListener("input", handleYearChange);

function handleYearChange() {
  fetchData();

  year = parseInt(yearSlider.value);
  decade.textContent = year;
  fetchData();
}

function nextDecade() {
  if (year < 2020) {
    year += 10;
    yearSlider.value = year.toString();
  }
  decade.textContent = year;
  fetchData();
}

function previousDecade() {
  if (year > 1980) {
    year -= 10;
    yearSlider.value = year.toString();
  }
  decade.textContent = year;
  fetchData();
}

var width = Math.max(
  document.documentElement.clientWidth,
  window.innerWidth || 0
);
var height = Math.max(
  document.documentElement.clientHeight,
  window.innerHeight || 0
);

var svg = d3.select("body").append("svg").style("cursor", "move");

svg
  .attr("viewBox", "0 0 0" + width + " " + height)
  .attr("preserveAspectRatio", "xMinYMin");

var zoom = d3.zoom().on("zoom", function () {
  var transform = d3.zoomTransform(this);
  map.attr("transform", transform);
});

svg.call(zoom);

var map = svg.append("g").attr("class", "map");

function fetchData() {
  d3.queue()
    .defer(d3.json, "src/json/geo_countries.json")
    .defer(d3.json, "src/json/countries_female.json")
    .await(function (error, world, data) {
      if (error) {
        console.error("Something went wrong: " + error);
      } else {
        drawMap(world, data);
      }
    });
}

function drawMap(world, data) {
  var projection = d3
    .geoMercator()
    .scale(130)
    .translate([width / 2, height / 2]);

  var path = d3.geoPath().projection(projection);

  var color = d3
    .scaleThreshold()
    .domain([
      18.5, 22, 25, 27.5, 30, 32.5, 35
    ])
    .range([
      "#bfcbdb",
      "#ccebc5",
      "#a8ddb5",
      "#7bccc4",
      "#4eb3d3",
      "#2b8cbe",
      "#08589e",
    ]);

  var features = topojson.feature(world, world.objects.countries).features;
  var bmiById = {};

  data.forEach(function (d) {
    bmiById[d["Country Name"]] = {
      bmi: +d[year],
      bmi1980: +d[1980],
      bmi1990: +d[1990],
      bmi2000: +d[2000],
      bmi2010: +d[2010],
      bmi2020: +d[2020],
    };
  });
  features.forEach(function (d) {
    d.details = bmiById[d.properties.name]
      ? bmiById[d.properties.name]
      : {};
  });

  map
    .append("g")
    .selectAll("path")
    .data(features)
    .enter()
    .append("path")
    .attr("name", function (d) {
      return d.properties.name;
    })
    .attr("id", function (d) {
      return d.id;
    })
    .attr("d", path)
    .style("fill", function (d) {
      return d.details && d.details.bmi
        ? color(d.details.bmi)
        : undefined;
    })
    .on("mouseover", function (d) {
      d3.select(this)
        .style("stroke", "white")
        .style("stroke-width", 1.2)
        .style("cursor", "pointer");

      d3.select(".country").text(d.properties.name);

      d3.select(".bmi").text(
        (d.details &&
          d.details.bmi &&
          "BMI: " + Number(d.details.bmi).toLocaleString()) ||
          "No Data"
      );

      const data = [
        { year: 1980, bmi: d.details.bmi1980 },
        { year: 1990, bmi: d.details.bmi1990 },
        { year: 2000, bmi: d.details.bmi2000 },
        { year: 2010, bmi: d.details.bmi2010 },
        { year: 2020, bmi: d.details.bmi2020 },
      ];

      var svgWidth = 330;
      var svgHeight = 250;
      var margin = { top: 30, right: 40, bottom: 30, left: 40 };
      var graphWidth = svgWidth - margin.left - margin.right;
      var graphHeight = svgHeight - margin.top - margin.bottom;

      d3.select(".graph").selectAll("svg").remove();

      var svg = d3
        .select(".graph")
        .append("svg")
        .attr("width", svgWidth)
        .attr("height", svgHeight);

      var graph = svg
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      var xScale = d3.scaleTime().range([0, graphWidth]);
      var yScale = d3.scaleLinear().range([graphHeight, 0]);

      xScale.domain([new Date(1980, 0, 1), new Date(2020, 0, 1)]);
      yScale.domain([
        18,
        d3.max(data, function (d) {
          return d.bmi;
        }),
      ]);

      var line = d3
        .line()
        .x(function (d) {
          return xScale(new Date(d.year, 0, 1));
        })
        .y(function (d) {
          return yScale(d.bmi);
        });

      graph.append("path").datum(data).attr("class", "line").attr("d", line);

      graph
        .append("g")
        .attr("class", "x-axis")
        .attr("transform", "translate(0," + graphHeight + ")")
        .call(d3.axisBottom(xScale).ticks(d3.timeYear.every(10)));

      graph.append("g").attr("class", "y-axis").call(d3.axisLeft(yScale));

      svg
        .selectAll(".x-axis text")
        .attr("fill", "white")
        .style("font-size", "12px")
        .style("font-weight", "700");
      svg
        .selectAll(".y-axis text")
        .attr("fill", "white")
        .style("font-size", "12px")
        .style("font-weight", "700");

      d3.select(".details").style("visibility", "visible");
      d3.select(".graph").style("visibility", "visible");
    })
    .on("mouseout", function (d) {
      d3.select(this).style("stroke", null).style("stroke-width", 0.5);

      d3.select(".details").style("visibility", "hidden");
      d3.select(".graph").style("visibility", "hidden");
    });
}
