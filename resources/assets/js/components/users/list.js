import React, { Component } from 'react'
import UserModel from './model'
import config from '../config'
import queryString from 'query-string'
import { BrowserRouter as Router, Link } from 'react-router-dom'
import { Pagination, LoadingIndicator } from '../libs'

export default class UserList extends Component {
  constructor (props) {
    super(props)
    // set state mac dinh
    this.state = {
      loading: true,
      message: null,
      status: null,
      users: null,
      search: queryString.parse(props.location.search).search || ''
    }

    // Trang mặc định khi vừa load
    this.currentPage = queryString.parse(props.location.search).page || 1
    this.firstInit = 1
    this.timeoutId = null

    // binding event
    this.handleSearch = this.handleSearch.bind(this)
    this.refreshPage = this.refreshPage.bind(this)
  }

  componentDidMount () {
    this.getUsers()
  }

  componentWillReceiveProps (nextProps) {
    if (this.props.location.search !== nextProps.location.search) {
      this.currentPage = queryString.parse(nextProps.location.search).page || 1
      this.getUsers(nextProps)
    }
    this.setState({
      message: null,
      status: null
    })
  }

  getUsers (props = this.props, forcePage = null) {
    if (!this.state.loading) {
      this.setState({loading: true})
    }
    let page = 1
    let search = this.state.search || ''
    let uri = props.location.search ? queryString.parse(props.location.search) : ''
    if (uri !== '') {
      page = uri.page || 1
      // neu currentPage khac page thi uu tien currentPage
      if (this.currentPage !== page) {
        page = this.currentPage
      }

      // uu tien trang duoc tai?
      if (forcePage) {
        page = forcePage
      }
      search = uri.search || ''
      if (this.firstInit !== 1 && this.state.search !== search) {
        search = this.state.search
      }
    }
    // sau khi load xong lan dau tien
    this.firstInit = 0

    UserModel.getUsers(page, search)
      .then(results => this.setState({
        users: results.data,
        search: search,
        loading: false
      }))
      .catch(error => console.log(error))
  }

  deleteUser (user) {
    if (window.confirm('Are you sure?')) {
      UserModel.deleteUser(user.id)
        .then(results => {
          if (results.data.status === 'success') {
            this.state.users.data.splice(this.state.users.data.indexOf(user), 1)
          }
          this.setState({
            message: results.data.message || null,
            status: results.data.status || null
          })
        }
        )
        .catch(error => console.log('error', error))
    }
  }

  handleSearch (event) {
    let page = 1
    if (this.timeoutId) {
      clearTimeout(this.timeoutId)
    }
    this.currentPage = 1
    this.setState({
      search: event.target.value
    })
    this.timeoutId = setTimeout(() => {
      this.getUsers(this.props, page)
    }, 300)
  }

  refreshPage (event) {
    this.setState({
      message: null,
      status: null
    })
    this.getUsers()
  }

  render () {
    const users = this.state.users
    return (
      <div className='user-wrapper'>
        {
          this.state.status && this.state.message &&
          <div id='dusm' className={`alert alert-${this.state.status}`} role='alert'>
            <span className='glyphicon glyphicon-exclamation-sign' aria-hidden='true' />
            <span>{this.state.message}</span>
          </div>
        }
        <h3 className='page-header mb-1'>Users List</h3>
        <div className='mb-2'>
          <Link title='create user' to='/users/create' className='btn btn-primary'><i className='fa fa-user-plus' /></Link>
          <button title='reload' className='btn btn-reload btn-outline-dark ml-1' onClick={this.refreshPage}><i className='fa fa-refresh' /></button>
          <form className='form-inline ml-1' style={{display: 'inline-block'}}>
            <input type='text' className='form-control search-box' name='search' placeholder='Search by name...' onChange={this.handleSearch} value={this.state.search} />
          </form>
        </div>
        <div className='table-userlist-wrap'>
          {this.state.loading &&
          <div className='loading-icon-wrap'>
            <LoadingIndicator width={48} height={48} show={this.state.loading} />
          </div>
          }
          <table className='table table-striped table-hover table-bordered table-responsive mb-2'>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Operation</th>
              </tr>
            </thead>
            <tbody>
              {
                users !== null && users.data.length > 0
                  ? users.data.map((user, key) =>
                    <tr key={key}>
                      <td>{ user.id }</td>
                      <td>{ user.name }</td>
                      <td>{ user.email }</td>
                      <td>
                        <Link style={{lineHeight: '30px'}} to={`/users/${user.id}`} className='btn btn-primary btn-sm'>Edit</Link>
                        <button onClick={this.deleteUser.bind(this, user)} className='btn btn-danger btn-sm ml-1'>Delete</button>
                      </td>
                    </tr>
                  )
                  : <tr>
                    <td colSpan={4}>There is no users at the moment!</td>
                  </tr>
              }
            </tbody>
          </table>
        </div>
        <nav aria-label='Page navigation' className='nav-pagination'>
          <Pagination data={this.state.users} range={config.paginationRange} to='users' search={this.state.search} />
        </nav>
      </div>
    )
  }
}
