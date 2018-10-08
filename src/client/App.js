import React, { Component } from 'react';
import './app.css';
import ReactImage from './react.png';

export default class App extends Component {
  state = { username: null };

  render() {
    return (
      <div>
        <a href="/oauth/zoho">Hello</a>
      </div>
    );
  }
}
