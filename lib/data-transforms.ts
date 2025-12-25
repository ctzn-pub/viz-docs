/**
 * Centralized registry for data transformation functions.
 * These are used by ComponentDoc and the Gallery to hydrate components with the correct data format.
 */

export const DATA_TRANSFORMS: Record<string, (rawData: any) => any> = {
    'recharts/generic/timeseries-basic-v1': (rawData) => {
        if (!rawData?.series?.[0]?.observations) return { data: [], metadata: {}, dataPointMetadata: [] };
        const series = rawData.series[0];
        const data = series.observations.map((o: any) => ({
            year: o.date?.substring(0, 4) || String(o.year),
            value: parseFloat(o.value),
        })).filter((d: any) => !isNaN(d.value));
        return {
            data,
            metadata: {
                type: 'timeseries',
                title: series.title || rawData.category,
                subtitle: series.units || '',
                source: { id: 'fred', name: 'Federal Reserve Economic Data' }
            },
            dataPointMetadata: [{ id: 'value', name: 'Value', type: 'number' }]
        };
    },
    'recharts/generic/timeseries-dual-axis-v1': (rawData) => {
        if (!rawData?.series || rawData.series.length < 2) return { series1Data: [], series2Data: [] };
        const housingStarts = rawData.series.find((s: any) => s.id === 'HOUSTNSA');
        const caseShiller = rawData.series.find((s: any) => s.id === 'CSUSHPISA');
        if (!housingStarts || !caseShiller) return { series1Data: [], series2Data: [] };
        return {
            series1Data: housingStarts.observations.map((o: any) => ({ date: o.date, value: parseFloat(o.value) })),
            series2Data: caseShiller.observations.map((o: any) => ({ date: o.date, value: parseFloat(o.value) })),
            series1Name: housingStarts.title,
            series2Name: caseShiller.title,
            series1Unit: housingStarts.units,
            series2Unit: caseShiller.units,
            title: rawData.category
        };
    },
    'recharts/generic/timeseries-index-v1': (rawData) => {
        if (!rawData?.series || rawData.series.length < 2) return { series1: null, series2: null };
        return {
            series1: rawData.series[0],
            series2: rawData.series[1],
            title: rawData.category
        };
    },
    'recharts/generic/demographic-breakdown-v1': (rawData) => ({
        data: rawData
    }),
    'recharts/ess/scatter-regression-v1': (rows) => {
        if (!Array.isArray(rows)) return { data: [] };
        const normalizeReligion = (s: string | undefined) => {
            const v = (s || "").toLowerCase();
            if (v.includes("catholic")) return "Catholic";
            if (v.includes("protestant")) return "Protestant";
            if (v.includes("orthodox")) return "Orthodox";
            if (v.includes("muslim") || v.includes("islam")) return "Muslim";
            return "Other";
        };
        const data = rows.map((r: any) => {
            const region = normalizeReligion(r.religion);
            return {
                name: r.cntry,
                religion: r.religion || region,
                region,
                population_m: Number(r.population ?? 0),
                happiness: Number(r.happiness || 0),
                hdi: Number(r.hdi || 0),
                gdp: Number(r.gdp || 0),
                education: Number(r.education || 0)
            };
        });
        return { data };
    },
    'recharts/gss/timetrend-demo-v1': (rawData) => {
        const dataPoints = rawData?.dataPoints || [];
        const demographicField = 'PolParty';
        const demographicGroups = rawData?.dataPointMetadata
            ?.find((item: any) => item.id === demographicField)
            ?.categories || [];
        return {
            data: {
                metadata: rawData?.metadata || { title: 'Time Trend', source: { name: 'General Social Survey' } },
                dataPoints: dataPoints,
                dataPointMetadata: rawData?.dataPointMetadata || []
            },
            demographicGroups: demographicGroups,
            demographic: demographicField
        };
    },
    'plot/geo/state-map-v1': (rawData) => {
        const data = rawData?.data || rawData;
        const stateData = data?.state_data;
        const formattedData = stateData
            ? Object.keys(stateData).map((key) => ({
                state: stateData[key].state_name,
                value: stateData[key].overall
            }))
            : [];
        return {
            data: formattedData,
            title: data?.clean_title || '',
            year: data?.year || '',
            description: data?.question || '',
            source: "CDC Behavioral Risk Factor Surveillance System",
            labels: { valueSuffix: '%' }
        };
    },
    'recharts/brfss/state-bar-v1': (rawData) => ({
        data: rawData?.state_data ? rawData : { state_data: {}, clean_title: '', year: '', question: '' }
    }),
    'recharts/brfss/state-bar-sortable-v1': (rawData) => ({
        data: rawData?.state_data ? rawData : { state_data: {}, clean_title: '', year: '', question: '' }
    }),
    'plot/brfss/state-bar-v1': (rawData) => {
        if (!rawData?.states) return { data: [], title: '', subtitle: '', valueLabel: '', valueUnit: '', caption: '' };
        return {
            data: rawData.states,
            title: rawData.clean_title,
            subtitle: rawData.question,
            valueLabel: rawData.data_value_type || 'Value',
            valueUnit: rawData.data_value_unit || '%',
            caption: [rawData.class, rawData.year].filter(Boolean).join(' • '),
            height: 900
        };
    },
    'plot/timeseries/multiline-v1': (rawData) => ({
        data: rawData,
        xKey: "date",
        yKey: "homevalue",
        groupKey: "state",
        title: "Median Home Prices by State",
        caption: "Data Source: Zillow",
        yLabel: "Home Value",
        yFormat: "index",
        showIndexSlider: true
    }),
    'plot/stats/split-bar-v1': (rawData) => {
        if (!rawData?.states) return { data: [] };
        const transformedData = rawData.states
            .filter((s: any) => s.state_abbr !== 'US' && s.state_abbr !== 'UW')
            .map((stateData: any) => ({
                category: stateData.state_name,
                state_abbr: stateData.state_abbr,
                overall: stateData.overall,
                values: stateData.values || {}
            }));
        return {
            data: transformedData,
            title: rawData.clean_title,
            subtitle: rawData.question,
            valueLabel: `${rawData.data_value_type || 'Value'} (${rawData.data_value_unit || '%'})`,
            caption: [rawData.class, rawData.year, rawData.demographic_category].filter(Boolean).join(' • '),
            marginLeft: 150
        };
    },
    'plot/gss/timetrend-demo-v1': (rawData) => ({
        data: rawData,
        defaults: {
            x: "year",
            y: "value",
            color: "PolParty",
            errorbar: "ci",
            plotBands: "PrezEra"
        },
        colors: {
            PolParty: {
                Democrat: '#2196f3',
                Republican: '#f44336',
                Independent: '#4caf50',
            }
        },
        label: "Political Party:",
        error: "yes"
    }),
    'plot/stats/odds-ratio-basic-v1': (rawData) => ({
        data: rawData?.odds_ratios ? rawData : { odds_ratios: {}, conf_int_lower: {}, conf_int_upper: {} }
    }),
    'plot/stats/odds-ratio-forest-v1': (rawData) => ({
        data: rawData?.odds_ratios ? rawData : { odds_ratios: {}, conf_int_lower: {}, conf_int_upper: {} }
    }),
    'plot/stats/odds-ratio-dotplot-v1': (rawData) => ({
        data: rawData?.odds_ratios ? rawData : { odds_ratios: {}, conf_int_lower: {}, conf_int_upper: {} }
    }),
    'plot/stats/correlation-heatmap-v1': (rawData) => ({
        data: Array.isArray(rawData) ? rawData : []
    }),
    'plot/stats/density-overlay-v1': (rawData) => ({
        data: Array.isArray(rawData) ? rawData : []
    }),
    'plot/stats/density-basic-v1': (rawData) => ({
        data: Array.isArray(rawData) ? rawData : []
    }),
    'plot/stats/demographic-panel-v1': (rawData) => ({
        data: rawData?.by_demographic ? rawData : { by_demographic: {} }
    }),
    'plot/health/health-scatter-basic-v1': (rawData) => ({
        data: Array.isArray(rawData) ? rawData : []
    }),
    'plot/health/health-scatter-regression-v1': (rawData) => ({
        data: Array.isArray(rawData) ? rawData : []
    }),
    'plot/health/health-scatter-faceted-v1': (rawData) => ({
        data: Array.isArray(rawData) ? rawData : []
    }),
    'composite/dashboards/brfss-dashboard-v1': (rawData) => ({
        data: rawData,
        // The dashboard internally handles most mapping if it gets the rawData
    })
};

export function getTransformForPath(path: string) {
    return DATA_TRANSFORMS[path] || null;
}
