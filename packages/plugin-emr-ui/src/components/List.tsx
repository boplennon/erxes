import Button from '@erxes/ui/src/components/Button';
import { IEmr, IType } from '../types';
import Row from './Row';
import { IButtonMutateProps } from '@erxes/ui/src/types';
import { __ } from '@erxes/ui/src/utils';
import React from 'react';
import Form from './Form';
import { Title } from '@erxes/ui-settings/src/styles';
import ModalTrigger from '@erxes/ui/src/components/ModalTrigger';
import Wrapper from '@erxes/ui/src/layout/components/Wrapper';
import Table from '@erxes/ui/src/components/table';
import DataWithLoader from '@erxes/ui/src/components/DataWithLoader';
import asyncComponent from '@erxes/ui/src/components/AsyncComponent';

type Props = {
  emrs: IEmr[];
  types: IType[];
  typeId?: string;
  renderButton: (props: IButtonMutateProps) => JSX.Element;
  remove: (emr: IEmr) => void;
  edit: (emr: IEmr) => void;
  loading: boolean;
};

function List({
  emrs,
  typeId,
  types,
  remove,
  renderButton,
  loading,
  edit
}: Props) {
  const trigger = (
    <Button id={'AddEmrButton'} btnStyle="success" icon="plus-circle">
      Add Emr
    </Button>
  );

  const modalContent = props => (
    <Form {...props} types={types} renderButton={renderButton} emrs={emrs} />
  );

  const actionBarRight = (
    <ModalTrigger
      title={__('Add emr')}
      trigger={trigger}
      content={modalContent}
      enforceFocus={false}
    />
  );

  const title = <Title capitalize={true}>{__('Emr')}</Title>;

  const actionBar = (
    <Wrapper.ActionBar left={title} right={actionBarRight} wideSpacing />
  );

  const content = (
    <Table>
      <thead>
        <tr>
          <th>{__('Todo')}</th>
          <th>{__('Expiry Date')}</th>
          <th>{__('Actions')}</th>
        </tr>
      </thead>
      <tbody id={'EmrsShowing'}>
        {emrs.map(emr => {
          return (
            <Row
              space={0}
              key={emr._id}
              emr={emr}
              remove={remove}
              edit={edit}
              renderButton={renderButton}
              emrs={emrs}
              types={types}
            />
          );
        })}
      </tbody>
    </Table>
  );

  const SideBarList = asyncComponent(() =>
    import(/* webpackChunkName: "List - Emrs" */ '../containers/SideBarList')
  );

  const breadcrumb = [
    { title: __('Settings'), link: '/settings' },
    { title: __('Emrs'), link: '/emrs' }
  ];

  return (
    <Wrapper
      header={<Wrapper.Header title={__('Emrs')} breadcrumb={breadcrumb} />}
      actionBar={actionBar}
      content={
        <DataWithLoader
          data={content}
          loading={loading}
          count={emrs.length}
          emptyText={__('Theres no emr')}
          emptyImage="/images/actions/8.svg"
        />
      }
      leftSidebar={<SideBarList currentTypeId={typeId} />}
      transparent={true}
      hasBorder
    />
  );
}

export default List;
