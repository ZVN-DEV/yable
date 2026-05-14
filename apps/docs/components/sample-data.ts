export interface Employee {
  id: number
  name: string
  department: string
  salary: number
  startDate: string
  email: string
  status: 'active' | 'inactive' | 'pending'
}

export const sampleEmployees: Employee[] = [
  {
    id: 1,
    name: 'Alice Johnson',
    department: 'Engineering',
    salary: 125000,
    startDate: '2021-03-15',
    email: 'alice@example.com',
    status: 'active',
  },
  {
    id: 2,
    name: 'Bob Smith',
    department: 'Marketing',
    salary: 95000,
    startDate: '2020-07-01',
    email: 'bob@example.com',
    status: 'active',
  },
  {
    id: 3,
    name: 'Carol Williams',
    department: 'Engineering',
    salary: 135000,
    startDate: '2019-11-20',
    email: 'carol@example.com',
    status: 'active',
  },
  {
    id: 4,
    name: 'David Brown',
    department: 'Sales',
    salary: 88000,
    startDate: '2022-01-10',
    email: 'david@example.com',
    status: 'pending',
  },
  {
    id: 5,
    name: 'Eva Martinez',
    department: 'Engineering',
    salary: 142000,
    startDate: '2018-05-22',
    email: 'eva@example.com',
    status: 'active',
  },
  {
    id: 6,
    name: 'Frank Lee',
    department: 'Marketing',
    salary: 91000,
    startDate: '2021-09-01',
    email: 'frank@example.com',
    status: 'inactive',
  },
  {
    id: 7,
    name: 'Grace Kim',
    department: 'Sales',
    salary: 97000,
    startDate: '2020-03-14',
    email: 'grace@example.com',
    status: 'active',
  },
  {
    id: 8,
    name: 'Henry Chen',
    department: 'Engineering',
    salary: 128000,
    startDate: '2022-06-15',
    email: 'henry@example.com',
    status: 'active',
  },
  {
    id: 9,
    name: 'Iris Patel',
    department: 'Marketing',
    salary: 102000,
    startDate: '2019-08-28',
    email: 'iris@example.com',
    status: 'active',
  },
  {
    id: 10,
    name: 'Jack Wilson',
    department: 'Sales',
    salary: 85000,
    startDate: '2023-01-05',
    email: 'jack@example.com',
    status: 'pending',
  },
]
