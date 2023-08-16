const RED = 0;
const GREEN = 1;
const BLUE = 2;
const ALPHA = 3;

const TENSION = 0.1;

function uploadImage(event) {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => setImage(reader.result, "preview");
}

// display uploaded image in 'preview' element
async function setImage(source, element) {
    let image = await IJS.Image.load(source);
    var result = image;
    document.getElementById(element).src = result.toDataURL();
}


// generates points on the graph
function generatePoints() {
    let array = []
    for (var i = -0xFF; i <= 0xFF; i+=(31.875)) {
        array.push({x:i,y:255})
    }
    array[Math.floor(array.length/2)].y = 0; 
    return array;
}


// make sure the new given color is within 0-255, and move it in bounds if it isnt
function updateColor(color) {
    var colorName = color == RED ? "red" : color == GREEN ? "green" : "blue";
    document.getElementById(colorName).value = Math.max(Math.min(document.getElementById(colorName).value, 0xFF), 0);
}

// sort points in graph based on their x value in ascending order 
function sortPoints() {
    chart.data.datasets.forEach(dataset => {
        dataset.data.sort((a,b) => a.x - b.x);
    })
    chart.update();
}


// predict the y coordinate of a point in the graph given the x coordinate
function predictY(points, x) {    
    for (var i = 1; i < points.length; i++) {
        if (x <= points[i].x) {
            m = (points[i].y-points[i-1].y)/(points[i].x-points[i-1].x) // m = (y₂-y₁)/(x₂-x₁)
            b = points[i].y - (m*points[i].x) // b = y - mx
            y = (m*x) + b // y = mx + b
            return y;
        }
    }
    return 255; // error lolz: our point is probably not on the edge of the graph so lets pretend its just 255
}


// update our image alpha based on the points in our graph
async function updateImageAlpha() {
    if(document.getElementById("preview").src) {
        let image = await IJS.Image.load(document.getElementById("preview").src);
        let data = Array.from(image.data);

        for (var i = 0; i < data.length; i+=4) {
            data[i+ALPHA] = Math.floor((
                predictY(chart.data.datasets[0].data, 255 - data[i + RED]) +
                predictY(chart.data.datasets[0].data, 255 - data[i + GREEN])  + 
                predictY(chart.data.datasets[0].data, 255 - data[i + BLUE])
            )/3)
        }

        image.data = data;
        document.getElementById("preview").src = image.toDataURL();
    }
}

// colormap chart
let chart = new Chart("colors", {
  type: "scatter",
  data: {
    datasets: [
        {data: generatePoints(),borderColor: "white",tension: TENSION,showLine:true},
    ]
  },
  options: {
    scales: {
        y: {min: 0, max: 0xFF},
        x: {min: -0xFF, max: 0xFF}
    },
    onHover: function(e) {
        const point = e.chart.getElementsAtEventForMode(e, 'nearest', { intersect: true }, false)
        if (point.length) e.native.target.style.cursor = 'grab'
        else e.native.target.style.cursor = 'default'
      },
      plugins: {
        legend: {display: false},
        dragData: {
          round: 1,
          dragX: true,
          showTooltip: true,
          onDrag: (e) => {              
            e.target.style.cursor = 'grabbing'
          },
          onDragEnd: (e) => {
            e.target.style.cursor = 'default'
            sortPoints();
          },
        }
      },
  }
});