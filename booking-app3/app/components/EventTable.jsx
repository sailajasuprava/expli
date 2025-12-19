import { IndexTable, Badge } from "@shopify/polaris";

const events = [
  { id: 1, name: "Big Bang - LED", status: "Active" },
  { id: 2, name: "Cooking Experience", status: "Active" },
];

export default function EventTable() {
  return (
    <IndexTable
      resourceName={{ singular: "event", plural: "events" }}
      itemCount={events.length}
      headings={[{ title: "Name" }, { title: "Status" }]}
      selectable={false}
    >
      {events.map((event, index) => (
        <IndexTable.Row id={event.id} key={event.id} position={index}>
          <IndexTable.Cell>{event.name}</IndexTable.Cell>
          <IndexTable.Cell>
            <Badge status="success">{event.status}</Badge>
          </IndexTable.Cell>
        </IndexTable.Row>
      ))}
    </IndexTable>
  );
}
