export const options = {
    chart: {
        animations: { enabled: true },
        toolbar: { show: false },
        width: '100px'
    },
    tooltip: {
        enabled: true,
        theme: false,
        style: {
            fontSize: '12px',
            fontFamily: undefined
        },
        x: {
            show: false,
            format: 'dd MMM',
            formatter: undefined,
        },
        y: {
            show: true,
            title: 'price'
        },
        marker: {
            show: false,
        },
        items: {
            display: 'flex',
        },
        fixed: {
            enabled: false,
            position: 'topRight',
            offsetX: 0,
            offsetY: 0,
        },
    },
    grid: {
        show: true,
        borderColor: '#767F92',
        strokeDashArray: 0
    },
    plotOptions: {
        candlestick: {
            colors: {
                upward: '#25CE8F',
                downward: '#F45353'
            }
        }
    },
    xaxis: {
        type: 'datetime',
        labels: {
            show: true,
            style: {
                colors: '#767F92',
                fontSize: '14px',
                cssClass: 'apexcharts-xaxis-label',
            },
        }
    },
    yaxis: {
        labels: {
            show: true,
            minWidth: 0,
            maxWidth: 160,
            style: {
                color: '#F1F2F9',
                fontSize: '14px',
                cssClass: 'apexcharts-yaxis-label',
            },
            offsetX: 0,
            offsetY: 0,
            rotate: 0,
        }
    }
}

export const defaultSeries = []

const generateRandomData = () => {
    const data = [];
    const startDate = new Date(2022, 1, 1);

    for (let i = 0; i < 26; i++) {
        const open = Math.floor(Math.random() * 1000) + 4000;
        const high = open + Math.floor(Math.random() * 500) + 100;
        const low = open - Math.floor(Math.random() * 500) - 100;
        const close = Math.floor(Math.random() * 1000) + 4000;

        const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
        const dataPoint = {
            x: date,
            y: [open, high, low, close],
        };
        data.push(dataPoint);
    }
    return data;
};

// Code in the series as a temporary placeholder for demonstration

export const series = [
    {
        data: generateRandomData()
    }
]



