var ctx_ridd = document.getElementById("ridl_drive_panmictic_demo_chart");
var x_ridd = [];
var ridd_pan_chart = new Chart(ctx_ridd, {
    type: "line",
    data: {
        labels: x_ridd,
        datasets: [{
            label: "Size / capacity",
            data: []
        }, {
            label: "Drive frequency",
            data: []
        }, {
            label: "Resistance frequency",
            data: []
        }]
    },
    options: {
        scales: {
            xAxes: [{
                type: "linear",
                position: "bottom",
                ticks: {
                    suggestedMin: 0,
                    suggestedMax: 1
                }
            }]
        },
        animation: {
            duration: 0 // 一般动画时间
        },
        hover: {
            animationDuration: 0 // 悬停项目时动画的持续时间
        },
        elements: {
            line: {
                tension: 0 // 禁用贝塞尔曲线
            }
        },
        responsiveAnimationDuration: 0 // 调整大小后的动画持续时间
    }
});
var ridd_output = document.getElementById("ridl_drive_panmictic_demo_result");