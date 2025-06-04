import * as React from "react"
import { Tabs as RadixTabs } from "@radix-ui/react-tabs"

const Tabs = React.forwardRef((props, ref) => (
  <RadixTabs {...props} ref={ref} />
))

Tabs.TabList = RadixTabs.List
Tabs.TabTrigger = RadixTabs.Trigger
Tabs.TabContent = RadixTabs.Content

Tabs.displayName = "Tabs"

export { Tabs }
