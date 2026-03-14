"use client";

import { Card, AreaChart, BarChart, Title, Text, DonutChart, Flex, BadgeDelta, ProgressBar } from "@tremor/react";

interface RevenueData {
  date: string;
  Revenue: number;
}

interface ServiceData {
  name: string;
  value: number;
}

export function RevenueChart({ data }: { data: RevenueData[] }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Title className="text-slate-900 dark:text-white font-black tracking-tight">Evolução de Receita</Title>
          <Text className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest text-[10px]">Últimos 6 meses</Text>
        </div>
        <BadgeDelta deltaType="moderateIncrease" className="font-black text-[10px] uppercase">
          +12.5%
        </BadgeDelta>
      </div>
      <AreaChart
        className="h-72 mt-4"
        data={data}
        index="date"
        categories={["Revenue"]}
        colors={["pink"]}
        valueFormatter={(number: number) => `R$ ${Intl.NumberFormat("pt-BR").format(number).toString()}`}
        showLegend={false}
        showGridLines={false}
        showAnimation={true}
      />
    </div>
  );
}

export function ServicesDonut({ data }: { data: ServiceData[] }) {
  return (
    <div className="space-y-4">
      <Title className="text-slate-900 dark:text-white font-black tracking-tight">Distribuição de Serviços</Title>
      <DonutChart
        className="h-40 mt-6"
        data={data}
        category="value"
        index="name"
        colors={["pink", "rose", "fuchsia", "purple"]}
        variant="pie"
        showAnimation={true}
      />
      <div className="space-y-3 mt-6">
        {data.map((item, idx) => (
          <div key={item.name} className="space-y-1">
            <Flex>
              <Text className="text-xs font-bold text-slate-700 dark:text-slate-300">{item.name}</Text>
              <Text className="text-xs font-black text-slate-900 dark:text-white">{item.value}%</Text>
            </Flex>
            <ProgressBar value={item.value} color={idx === 0 ? "pink" : "rose"} className="mt-2" />
          </div>
        ))}
      </div>
    </div>
  );
}
