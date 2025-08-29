import ActionButtons from '@erxes/ui/src/components/ActionButtons';
import ModalTrigger from '@erxes/ui/src/components/ModalTrigger';
import Form from './Form';
import React from 'react';
import Button from '@erxes/ui/src/components/Button';
import Tip from '@erxes/ui/src/components/Tip';
import Icon from '@erxes/ui/src/components/Icon';
import styled from 'styled-components';
import styledTS from 'styled-components-ts';
import { IEmr, IType } from '../types';
import { IButtonMutateProps } from '@erxes/ui/src/types';
import { __ } from '@erxes/ui/src/utils';
import { FormControl } from '@erxes/ui/src/components/form';
import { colors, dimensions } from '@erxes/ui/src/styles';

const EmrNameStyled = styledTS<{ checked: boolean }>(styled.div).attrs({})`
    color: ${colors.colorCoreBlack};
    text-decoration: ${props => (props.checked ? 'line-through' : 'none')}
    `;

export const EmrWrapper = styledTS<{ space: number }>(
  styled.div
)`padding-left: ${props => props.space * 20}px;
  display:inline-flex;
  justify-content:flex-start;
  align-items: center;
`;

const Margin = styledTS(styled.div)`
 margin: ${dimensions.unitSpacing}px;
`;

type Props = {
  emr: IEmr;
  space: number;
  renderButton: (props: IButtonMutateProps) => JSX.Element;
  emrs: IEmr[];
  remove: (emr: IEmr) => void;
  edit: (emr: IEmr) => void;
  types?: IType[];
};

type State = {
  checked: boolean;
};

class Row extends React.Component<Props, State> {
  Emrs({ emr, checked }) {
    return <EmrNameStyled checked={checked}>{emr.name}</EmrNameStyled>;
  }

  removeEmr = () => {
    const { remove, emr } = this.props;

    remove(emr);
  };

  toggleCheck = () => {
    const { edit, emr } = this.props;

    edit({ _id: emr._id, checked: !emr.checked });
  };

  render() {
    const { emr, renderButton, space, emrs, types } = this.props;

    const editTrigger = (
      <Button btnStyle='link'>
        <Tip text={__('Edit')} placement='top'>
          <Icon icon='edit-3'></Icon>
        </Tip>
      </Button>
    );

    const content = props => (
      <Form
        {...props}
        types={types}
        emr={emr}
        renderButton={renderButton}
        emrs={emrs}
      />
    );

    const extractDate = emr.expiryDate
      ? emr.expiryDate?.toString().split('T')[0]
      : '-';

    return (
      <tr>
        <td>
          <EmrWrapper space={space}>
            <FormControl
              componentclass='checkbox'
              onChange={this.toggleCheck}
              color={colors.colorPrimary}
              defaultChecked={emr.checked || false}
            ></FormControl>
            <Margin>
              <this.Emrs emr={emr} checked={emr.checked || false} />
            </Margin>
          </EmrWrapper>
        </td>
        <td>{extractDate}</td>
        <td>
          <ActionButtons>
            <ModalTrigger
              title='Edit emr'
              trigger={editTrigger}
              content={content}
            />

            <Tip text={__('Delete')} placement='top'>
              <Button
                btnStyle='link'
                onClick={this.removeEmr}
                icon='times-circle'
              />
            </Tip>
          </ActionButtons>
        </td>
      </tr>
    );
  }
}

export default Row;
