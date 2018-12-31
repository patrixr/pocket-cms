<template>
  <div class="container">
    <el-tabs>
      <el-tab-pane v-for="(machineData, idx) in machines" :label="'Machine ' + idx" :key="machineData.machineId">
        <el-row  class="info-row" v-for="(value, key) in machineData.machineInfo" :key="machineData.machineId + '.' + key">
          <el-col :span="10">{{ key }} : </el-col>
          <el-col :span="14"> {{ value }} </el-col>
        </el-row>
        <div v-for="graph in machineData.graphs" class="chart-row" :key="`${machineData.machineId}.${graph.name}`">
          <div class="graph-title"> {{ graph.name }} </div>
          <monitor-graph :height="300" :points="graph.points" :unit="graph.unit"></monitor-graph>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script>
import PocketService  from '../services/PocketService';
import _              from 'lodash';
import MonitorGraph   from './MonitorGraph';


export default {
  components: {
    MonitorGraph
  },
  data() {
    return {
      machines: {},
      graphs: []
    }
  },
  created() {
    this.loadData();
  },
  methods: {
    async loadData() {
      this.machines   = await PocketService.fetchMonitoringStats();

      _.each(this.machines, machine => {
        if (!machine.records || !machine.records.length) {
          return;
        }
        const graphKeys = _.keys(_.last(machine.records).stats);
        machine.graphs = graphKeys.map((gkey) => {
          let unit    = '';
          let points  = machine.records.map(r => {
            let stat = r.stats[gkey] ? r.stats[gkey] : 0;
            unit = stat.unit;
            return {
              values: stat.values,
              at: r._createdAt
            };
          });
          return {
            name: gkey,
            points,
            unit
          };
        });
      });
    }
  }
}
</script>

<style lang="scss" scoped>
.container {
  padding: 20px;

  .chart-row {
    .graph-title {
      padding-left: 1rem;
      margin-top: 1rem;
    }
    position: relative;
    height: 350px;
    width: auto;
    margin-bottom: 1rem;
  }

  .info-row {
    text-indent: 10px;
    padding-bottom: 10px;
    margin-top: 10px;
    border-bottom: 1px solid gray;
    .el-col:nth-child(2) {
      color: gray;
    }
  }
}
</style>

