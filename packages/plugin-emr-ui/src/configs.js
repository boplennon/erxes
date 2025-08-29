module.exports = {
  srcDir: __dirname,
  name: "emr",
  port: 3236,
  scope: "emr",
  exposes: {
    "./routes": "./src/routes.tsx",
  },
  routes: {
    url: "http://localhost:3236/remoteEntry.js",
    scope: "emr",
    module: "./routes",
  },
  menus:[{"text":"EMR","url":"/emr","icon":"icon-star","location":"mainNavigation",  "scope": 'emr',}],
};

// module.exports = {
//   srcDir: __dirname,
//   name: 'cms',
//   port: 3126,
//   scope: 'cms',
//   exposes: {
//     './routes': './src/routes.tsx',
//   },
//   routes: {
//     url: 'http://localhost:3126/remoteEntry.js',
//     scope: 'cms',
//     module: './routes',
//   },
//   menus: [
//     {
//       text: 'CMS',
//       url: '/cms/posts',
//       icon: 'icon-star',
//       location: 'mainNavigation',
//       scope: 'cms',
//     }
//   ],
// };
