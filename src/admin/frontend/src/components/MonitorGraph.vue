<script>
import _        from 'lodash'
import { Line } from 'vue-chartjs'
import units    from '../../../../utils/units'

const colors = [
  '#409EFF',
  '#67C23A',
  '#E6A23C',
  '#F56C6C',
  '#909399'
];

function timeString(d) {
  return new Date(d).toLocaleTimeString().replace(/:[^:]+$/, '')
}

function dateString(d) {
  return new Date(d).toLocaleDateString();
}

function dateTimeString(d) {
  return `${dateString(d)} ${timeString(d)}`;
}

export default {
  extends: Line,
  props: [
    'points',
    'unit'
  ],
  computed: {
    datasets() {
      const lineKeys = _.keys(_.get(_.last(this.points), 'values', {})).slice(0, colors.length);
      return _.map(lineKeys, (key, idx) => {
        return {
          label: key + (this.unit ? ` (${this.unit})` : ''),
          borderColor: colors[idx],
          pointRadius: 2,
          fill: false,
          data: this.points.map(p => p.values[key] || 0)
        };
      });
    },
    labels() {
      let labels = [];
      let lastRef = 0;
      for (let i = 0; i < this.points.length; ++i) {
        const { at } = this.points[i];
        if (at - lastRef >= units.hours(3) || i === this.points.length - 1) {
          labels.push(dateTimeString(at));
          lastRef = at;
          continue;
        }
        labels.push('');
      }
      return labels;
    }
  },
  mounted () {
    setTimeout(() => {
      this.renderChart({
        labels: this.labels,
        datasets: this.datasets
      }, {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          yAxes: [{
            display: true,
            ticks: {
              beginAtZero: true
            }
          }]
        }
      });
    });
  }
}
</script>

<style lang="scss" scoped>
  canvas {
    width: auto;
    height: 300px;
  }
</style>

