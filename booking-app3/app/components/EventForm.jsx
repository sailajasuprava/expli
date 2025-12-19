import { TextField, Select, Layout } from "@shopify/polaris";
import { useState } from "react";

export default function EventForm() {
  const [name, setName] = useState("");
  const [duration, setDuration] = useState("30");
  const [max, setMax] = useState("1");

  return (
    <Layout>
      <Layout.Section oneHalf>
        <TextField label="Name" value={name} onChange={setName} />
      </Layout.Section>
      <Layout.Section oneHalf>
        <TextField
          label="Duration"
          value={duration}
          suffix="minutes"
          onChange={setDuration}
        />
      </Layout.Section>
      <Layout.Section oneHalf>
        <TextField label="Max attendees" value={max} onChange={setMax} />
      </Layout.Section>
      <Layout.Section oneHalf>
        <Select
          label="Linked product"
          options={[{ label: "Select product", value: "" }]}
        />
      </Layout.Section>
    </Layout>
  );
}
