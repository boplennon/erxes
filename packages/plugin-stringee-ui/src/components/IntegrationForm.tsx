import { IButtonMutateProps, IFormProps } from '@erxes/ui/src/types';

import Button from '@erxes/ui/src/components/Button';
import ControlLabel from '@erxes/ui/src/components/form/Label';

import Form from '@erxes/ui/src/components/form/Form';
import FormControl from '@erxes/ui/src/components/form/Control';
import FormGroup from '@erxes/ui/src/components/form/Group';
import { ModalFooter } from '@erxes/ui/src/styles/main';
import React from 'react';
import SelectBrand from '@erxes/ui-inbox/src/settings/integrations/containers/SelectBrand';
import SelectChannels from '@erxes/ui-inbox/src/settings/integrations/containers/SelectChannels';
import Accounts from '../containers/Accounts';
import SelectTeamMembers from '@erxes/ui/src/team/containers/SelectTeamMembers';

type Props = {
  renderButton: (props: IButtonMutateProps) => JSX.Element;
  callback: () => void;
  onChannelChange: () => void;
  channelIds: string[];
};

type State = {
  callCenterPhoneNumber: string;
  memberIds: string |  string[]
};
class IntegrationForm extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)

    this.state = {
      callCenterPhoneNumber: "",
      memberIds: []
    }
  }

  onSelectAccount = (accountId: string) => {
    this.setState({ callCenterPhoneNumber: accountId });
  }

  generateDoc = (values: {
    name: string;
    brandId: string;
    callCenterPhoneNumber: string;
  }) => {
    return {
      name: values.name,
      brandId: values.brandId,
      kind: 'stringee',
      data : {
        callCenterPhoneNumbers: values.callCenterPhoneNumber?.split(","),
        memberIds: this.state.memberIds,
      }
    };
  };

  renderField = ({
    label,
    fieldName,
    formProps
  }: {
    label: string;
    fieldName: string;
    formProps: IFormProps;
  }) => {
    return (
      <FormGroup>
        <ControlLabel required={true}>{label}</ControlLabel>
        <FormControl
          {...formProps}
          name={fieldName}
          required={true}
          autoFocus={fieldName === 'name'}
        />
      </FormGroup>
    );
  };

  renderContent = (formProps: IFormProps) => {
    const { renderButton, callback, onChannelChange, channelIds } = this.props;
    const { values, isSubmitted } = formProps;
    console.log("integrationDetailsForm Stringee")
    return (
      <>

      {this.renderField({ label: 'Name', fieldName: 'name', formProps })}

        <SelectBrand
          isRequired={true}
          formProps={formProps}
          description={(
            'Which specific Brand does this integration belong to?'
          )}
        />

        <SelectChannels
          defaultValue={channelIds}
          isRequired={true}
          onChange={onChannelChange}
        />
        <SelectTeamMembers 
            label={'Choose team member'}
            name="assignedUserId"
          
            onSelect={values => this.setState(value => ({...this.state, memberIds: values}))}
            
        />
      {this.renderField({ label: 'Call Center Number', fieldName: 'callCenterPhoneNumber', formProps })}


        <ModalFooter>
          <Button
            btnStyle="simple"
            type="button"
            onClick={callback}
            icon="times-circle"
          >
            Cancel
          </Button>
          {renderButton({
            values: this.generateDoc(values),
            isSubmitted,
            callback
          })}
        </ModalFooter>
      </>
    );
  };

  render() {
    return <Form renderContent={this.renderContent} />;
  }
}

export default IntegrationForm;
