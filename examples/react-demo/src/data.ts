export interface Person {
  id: number
  firstName: string
  lastName: string
  email: string
  age: number
  role: string
  department: string
  salary: number
  startDate: string
  active: boolean
}

export const people: Person[] = [
  { id: 1, firstName: 'Alice', lastName: 'Johnson', email: 'alice@example.com', age: 32, role: 'Engineer', department: 'Engineering', salary: 125000, startDate: '2021-03-15', active: true },
  { id: 2, firstName: 'Bob', lastName: 'Smith', email: 'bob@example.com', age: 28, role: 'Designer', department: 'Design', salary: 95000, startDate: '2022-07-01', active: true },
  { id: 3, firstName: 'Carol', lastName: 'Williams', email: 'carol@example.com', age: 45, role: 'VP Engineering', department: 'Engineering', salary: 210000, startDate: '2019-01-10', active: true },
  { id: 4, firstName: 'David', lastName: 'Brown', email: 'david@example.com', age: 35, role: 'Product Manager', department: 'Product', salary: 140000, startDate: '2020-11-20', active: true },
  { id: 5, firstName: 'Eve', lastName: 'Davis', email: 'eve@example.com', age: 26, role: 'Junior Engineer', department: 'Engineering', salary: 85000, startDate: '2023-02-14', active: true },
  { id: 6, firstName: 'Frank', lastName: 'Miller', email: 'frank@example.com', age: 41, role: 'Senior Designer', department: 'Design', salary: 130000, startDate: '2018-09-05', active: false },
  { id: 7, firstName: 'Grace', lastName: 'Wilson', email: 'grace@example.com', age: 30, role: 'Engineer', department: 'Engineering', salary: 120000, startDate: '2021-06-30', active: true },
  { id: 8, firstName: 'Henry', lastName: 'Moore', email: 'henry@example.com', age: 38, role: 'Engineering Manager', department: 'Engineering', salary: 175000, startDate: '2019-04-22', active: true },
  { id: 9, firstName: 'Ivy', lastName: 'Taylor', email: 'ivy@example.com', age: 29, role: 'Designer', department: 'Design', salary: 100000, startDate: '2022-01-17', active: true },
  { id: 10, firstName: 'Jack', lastName: 'Anderson', email: 'jack@example.com', age: 33, role: 'Data Scientist', department: 'Engineering', salary: 145000, startDate: '2020-08-12', active: true },
  { id: 11, firstName: 'Kate', lastName: 'Thomas', email: 'kate@example.com', age: 27, role: 'Junior Designer', department: 'Design', salary: 75000, startDate: '2023-05-01', active: true },
  { id: 12, firstName: 'Liam', lastName: 'Jackson', email: 'liam@example.com', age: 42, role: 'VP Product', department: 'Product', salary: 200000, startDate: '2017-12-03', active: true },
  { id: 13, firstName: 'Mia', lastName: 'White', email: 'mia@example.com', age: 31, role: 'Engineer', department: 'Engineering', salary: 115000, startDate: '2021-09-14', active: false },
  { id: 14, firstName: 'Noah', lastName: 'Harris', email: 'noah@example.com', age: 36, role: 'Senior Engineer', department: 'Engineering', salary: 155000, startDate: '2019-02-28', active: true },
  { id: 15, firstName: 'Olivia', lastName: 'Martin', email: 'olivia@example.com', age: 24, role: 'Intern', department: 'Engineering', salary: 55000, startDate: '2024-01-08', active: true },
  { id: 16, firstName: 'Pete', lastName: 'Garcia', email: 'pete@example.com', age: 39, role: 'Product Manager', department: 'Product', salary: 135000, startDate: '2020-05-19', active: true },
  { id: 17, firstName: 'Quinn', lastName: 'Robinson', email: 'quinn@example.com', age: 34, role: 'Engineer', department: 'Engineering', salary: 128000, startDate: '2021-11-07', active: true },
  { id: 18, firstName: 'Rachel', lastName: 'Clark', email: 'rachel@example.com', age: 40, role: 'Design Director', department: 'Design', salary: 180000, startDate: '2018-03-25', active: true },
  { id: 19, firstName: 'Sam', lastName: 'Lewis', email: 'sam@example.com', age: 25, role: 'Junior Engineer', department: 'Engineering', salary: 80000, startDate: '2023-08-21', active: true },
  { id: 20, firstName: 'Tina', lastName: 'Lee', email: 'tina@example.com', age: 37, role: 'Senior Product Manager', department: 'Product', salary: 165000, startDate: '2019-07-15', active: true },
]

export const departments = ['Engineering', 'Design', 'Product']

export const roles = [
  'Intern', 'Junior Engineer', 'Engineer', 'Senior Engineer',
  'Engineering Manager', 'VP Engineering',
  'Junior Designer', 'Designer', 'Senior Designer', 'Design Director',
  'Product Manager', 'Senior Product Manager', 'VP Product',
  'Data Scientist',
]
