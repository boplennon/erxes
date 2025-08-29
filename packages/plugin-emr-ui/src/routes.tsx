import asyncComponent from '@erxes/ui/src/components/AsyncComponent';
import queryString from 'query-string';
import React from 'react';
import { Route, Routes} from 'react-router-dom';

const List = asyncComponent(() =>
  import(/* webpackChunkName: "List - Emrs" */ './containers/List')
);

const ERMComp = () => {
  // const queryParams = queryString.parse(location.search);
  // const { type } = queryParams;

  return <h1>TEST</h1>;
};

const routes = () => {
  return <Routes><Route path="/emr" element={<List />} /></Routes>;
};

export default routes;
