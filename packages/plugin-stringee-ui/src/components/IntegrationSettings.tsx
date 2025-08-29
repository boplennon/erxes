import CollapseContent from "@erxes/ui/src/components/CollapseContent";
import Icon from "@erxes/ui/src/components/Icon";
import React from "react";

class Settings extends React.Component<any> {
  render() {
    const { renderItem } = this.props;
    console.log("RENDER STRINGEE SETTING")
    return (
      <CollapseContent
        title="Stringee"
        beforeTitle={<Icon icon="puzzle-piece" />}
        transparent={true}
      >
        {renderItem("STRINGEE_ACCESS_KEY", "", "", "", "Key")}
        {renderItem("STRINGEE_ACCESS_TOKEN", "", "", "", "Token")}
      </CollapseContent>
    );
  }
}

export default Settings;
