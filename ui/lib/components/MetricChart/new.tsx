import 'echarts/lib/chart/bar'
import 'echarts/lib/chart/line'
import 'echarts/lib/component/grid'
import 'echarts/lib/component/legend'
import 'echarts/lib/component/tooltip'
import 'echarts/lib/component/legend/ScrollableLegendModel'
import 'echarts/lib/component/legend/ScrollableLegendView'
import 'echarts/lib/component/legend/scrollableLegendAction'

import dayjs from 'dayjs'
import ReactEchartsCore from 'echarts-for-react/lib/core'
import echarts from 'echarts/lib/echarts'
import _ from 'lodash'
import React, { useMemo, useRef, useEffect } from 'react'
import format from 'string-template'
import { getValueFormat } from '@baurine/grafana-value-formats'

import client from '@lib/client'
import { AnimatedSkeleton, Card } from '@lib/components'
import { useBatchClientRequest } from '@lib/utils/useClientRequest'
import ErrorBar from '../ErrorBar'

export type GraphType = 'bar' | 'line'

export interface ISeries {
  query: string
  name: string
}

export interface IMetricChartProps {
  title: React.ReactNode

  series: ISeries[]
  // stepSec: number
  beginTimeSec: number
  endTimeSec: number
  unit: string
  type: GraphType
  hideZero?: boolean
}

const HEIGHT = 250

function getSeriesProps(type: GraphType) {
  if (type === 'bar') {
    return {
      stack: 'bar_stack',
    }
  } else if (type === 'line') {
    return {
      showSymbol: false,
    }
  }
}

export default function NewMetricChart({
  title,
  series,
  // stepSec,
  beginTimeSec,
  endTimeSec,
  unit,
  type,
  hideZero,
}: IMetricChartProps) {
  // const timeParams = useRef(getTimeParams())

  const { isLoading, data, error, sendRequest } = useBatchClientRequest(
    series.map((s) => (reqConfig) =>
      client
        .getInstance()
        .metricsQueryGet(endTimeSec, s.query, beginTimeSec, 10, reqConfig)
    )
  )

  useEffect(() => {
    sendRequest()
  }, [beginTimeSec, endTimeSec])

  const valueFormatter = useMemo(() => getValueFormat(unit), [unit])

  const opt = useMemo(() => {
    const s: any[] = []
    data.forEach((dataBySeries, seriesIdx) => {
      if (!dataBySeries) {
        return
      }
      if (dataBySeries.status !== 'success') {
        return
      }
      const r = (dataBySeries.data as any)?.result
      if (!r) {
        return
      }
      r.forEach((rData) => {
        if (hideZero) {
          let hasNonZero = false
          for (const [ts, value] of rData.values) {
            if (value != 0) {
              hasNonZero = true
              break
            }
          }
          if (!hasNonZero) {
            return
          }
        }
        s.push({
          name: format(series[seriesIdx].name, rData.metric),
          data:
            rData.values.map(([ts, value]) => {
              return [ts * 1000, value]
            }) ?? [],
          type,
          ...getSeriesProps(type),
        })
      })
    })

    return {
      xAxis: {
        type: 'time',
        min: beginTimeSec * 1000,
        max: endTimeSec * 1000,
        splitLine: {
          show: true,
        },
        minorSplitLine: {
          show: true,
        },
        splitNumber: 10,
        boundaryGap: false,
        axisLabel: {
          formatter: (v) => {
            return dayjs(v).format('HH:mm')
          },
          showMinLabel: false,
          showMaxLabel: false,
        },
        axisLine: {
          lineStyle: {
            width: 0,
          },
        },
        axisTick: {
          lineStyle: {
            width: 0,
          },
        },
      },
      legend: {
        orient: 'horizontal',
        x: 'left', // 'center' | 'left' | {number},
        y: 'bottom',
        type: 'scroll',
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: (v) => {
            return valueFormatter(v, 1)
          },
        },
        splitLine: {
          show: true,
        },
        axisLine: {
          lineStyle: {
            width: 0,
          },
        },
        axisTick: {
          lineStyle: {
            width: 0,
          },
        },
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'line',
          animation: false,
          snap: true,
        },
        formatter: (series) => {
          let tooltip = ''

          const title = dayjs(series[0].axisValue).format('YYYY-MM-DD HH:mm:ss')
          tooltip += `<div>${title}</div>`

          series.forEach((s) => {
            tooltip += `<div>${s.marker} ${s.seriesName}: ${valueFormatter(
              s.value[1],
              1
            )}</div>`
          })

          return tooltip
        },
      },
      animation: false,
      grid: {
        top: 10,
        left: 70,
        right: 0,
        bottom: 60,
      },
      series: s,
    }
  }, [data, valueFormatter, series, type, hideZero])

  const showSkeleton = isLoading && _.every(data, (d) => d === null)

  let inner

  if (showSkeleton) {
    inner = <div style={{ height: HEIGHT }} />
  } else if (
    _.every(
      _.zip(data, error),
      ([data, err]) => err || !data || data?.status !== 'success'
    )
  ) {
    inner = (
      <div style={{ height: HEIGHT }}>
        <ErrorBar errors={error} />
      </div>
    )
  } else {
    inner = (
      <ReactEchartsCore
        echarts={echarts}
        lazyUpdate={true}
        style={{ height: HEIGHT }}
        option={opt}
        theme={'light'}
      />
    )
  }

  return (
    <div>
      <h3>{title}</h3>
      <AnimatedSkeleton showSkeleton={showSkeleton}>{inner}</AnimatedSkeleton>
    </div>
  )
}
