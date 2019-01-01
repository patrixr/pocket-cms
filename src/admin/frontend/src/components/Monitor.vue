<template>
  <el-container class="container" v-loading="loading">
    <el-main>
      <el-tabs>
        <el-tab-pane v-for="(machine, idx) in machines" :label="'Machine ' + idx" :key="machine.machineId">

          <el-row  class="info-row" v-for="(value, key) in machine.machineInfo" :key="machine.machineId + '.' + key">
            <el-col :span="10">{{ key }} : </el-col>
            <el-col :span="14"> {{ value }} </el-col>
          </el-row>

          <div class="nodes-container">
            <div class="title">Nodes</div>
            <div class="nodes">
              <div class="node" v-for="proc in machine.processes" :key="proc.pid" :class="`${ proc.alive ? 'alive' : 'dead' }`">
                <el-row>
                  <el-col :span="6"> PID </el-col>
                  <el-col :span="18"> {{ proc.pid  }} </el-col>
                </el-row>
                <el-row>
                  <el-col :span="6"> Ping </el-col>
                  <el-col :span="18"> {{ proc.lastPing | time-since }} </el-col>
                </el-row>
                <el-row>
                  <el-col :span="6"> Mem </el-col>
                  <el-col :span="18"> {{ proc.alive ? `${proc.ram} MB` : '-' }} </el-col>
                </el-row>
              </div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-main>
  </el-container>
</template>

<script>
import PocketService  from '../services/PocketService';
import common         from '../mixins/common'
import _              from 'lodash';

export default {
  mixins: [common],
  data() {
    return {
      processes: [],
      machines: {},
      graphs: []
    }
  },
  created() {
    this.loadData();
  },
  methods: {
    async loadData() {
      this.processes = await this.runTask('Fetching machine info', PocketService.fetchAllRecords('_processes'));
      this.machines  = _.map(_.groupBy(this.processes, 'machineId'), (processes, machineId) => {
        processes = _.orderBy(processes, ['alive', 'lastPing'], ['desc', 'desc']);
        return {
          machineId,
          processes,
          machineInfo: _.get(processes, '[0].machineInfo', {})
        }
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.container {
  padding: 20px;

  .info-row {
    text-indent: 10px;
    padding-bottom: 10px;
    margin-top: 10px;
    border-bottom: 1px solid gray;
    .el-col:nth-child(2) {
      color: gray;
    }
  }

  .nodes-container {
    position: relative;
    .title {
      margin-top: 2rem;
      margin-bottom:  0.4rem;
    }
    .nodes {
      display: flex;
      justify-content: space-between;
      position: relative;
      width: 100%;
      flex-wrap: wrap;
      .node {
        padding: 2rem 1rem;
        border: 5px solid rgba(#909399, 0.5);
        flex: 0 0 15rem;
        width: 15rem;
        margin-bottom: 0.5rem;
        margin-top: 0.5rem;
        font-size: 0.9rem;
        color: gray;
        &.alive {
          border-color: #67C23A
        }
      }
    }
  }
}
</style>

