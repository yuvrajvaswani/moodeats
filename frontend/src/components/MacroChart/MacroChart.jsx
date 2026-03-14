import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const toNumber = (value) => {
  const match = String(value || "").match(/\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : 0;
};

function MacroChart({ macros }) {
  const data = [
    { name: "Calories", value: toNumber(macros?.calories), fill: "#FF6B6B" },
    { name: "Protein", value: toNumber(macros?.protein), fill: "#4D96FF" },
    { name: "Carbs", value: toNumber(macros?.carbohydrates), fill: "#6BCB77" },
    { name: "Fat", value: toNumber(macros?.fat), fill: "#FFD166" },
  ];

  return (
    <div className="macro-chart-wrap">
      <h3 className="food-title">Macro Dashboard</h3>
      <div className="macro-chart-area">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eadcfb" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" radius={[8, 8, 0, 0]}>
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="macro-grid">
        <div className="macro-card"><p className="macro-label">Calories</p><p className="macro-value">{macros?.calories || "0 kcal"}</p></div>
        <div className="macro-card"><p className="macro-label">Protein</p><p className="macro-value">{macros?.protein || "0 g"}</p></div>
        <div className="macro-card"><p className="macro-label">Carbs</p><p className="macro-value">{macros?.carbohydrates || "0 g"}</p></div>
        <div className="macro-card"><p className="macro-label">Fat</p><p className="macro-value">{macros?.fat || "0 g"}</p></div>
      </div>
    </div>
  );
}

export default MacroChart;
