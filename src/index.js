const express = require('express')
const { v4: uuidv4 } = require('uuid');
const app = express()

app.use(express.json())

const customers = []
console.log("customers",customers)

function verifyExistyAccountPerCpf(request, response, next) {
const {cpf} = request.headers

const customer = customers.find(customer => customer.cpf === cpf)

if (!customer){
    return response.status(400).json({error: "Cliente não encontrado!"})
}

request.customer = customer

return next()
}

function getBalance(statement) {
  const balance = statement.reduce((acc, operation) => {
        if(operation === "credit") {
            return acc + operation.amount;
        }else {
            return acc -operation.amount;
        }
    }, 0)

}

app.post("/account", (request, response) => {
    const {cpf, name} = request.body

    const custummerAlredyExists = customers.some((customer) => customer.cpf === cpf)

    if(custummerAlredyExists) {
        return response.status(400).json({error: "Cliente já existe!"})
    }
  
    customers.push({
        cpf,
        name,
        id: uuidv4(),
        statement: []
    })
    return response.status(201).send()
})

app.get("/statement", verifyExistyAccountPerCpf, (request, response) => {
const {customer} = request
return response.json(customer.statement)
})

app.post("/deposity", verifyExistyAccountPerCpf, (request, response) => {
      const {description, amount} = request.body

  const {customer} = request;
  const statementOperation = {
      description, amount, created_at: new Date(), type: "credit"
  }
    customer.statement.push(statementOperation)
    return response.status(201).send()
})

app.post("/withdraw",verifyExistyAccountPerCpf, (request, response) => {
const {amount} = request.body
const {customer} = request;

const balance = getBalance(customer.statement)

if(balance < amount) {
    return response.status(400).json({error: "Saldo Insuficiente na conta"})
}

  const statementOperation = {
       amount, created_at: new Date(), type: "debit"
  }

  customer.statement.push(statementOperation)
  return response.status(201).send()
})

app.get("/statement/date", verifyExistyAccountPerCpf, (request, response) => {
const {customer} = request
const {date } = request.query;

const dateFormat = new Date(date + " 00:00")

const statement = customer.statement.filter((statement) => statement.created_at.toDateString() === new Date(dateFormat).toDateString())

return response.json(statement)
})

app.put("/account", verifyExistyAccountPerCpf, (request, response) => {
    const {name} = request.body;
    const {customer} = request

    customer.name = name;

    return response.status(201).send()

})

app.get("/account",verifyExistyAccountPerCpf, (request, response) => {
    const {customer} = request;
    return response.json(customer)
})

app.delete("/account",verifyExistyAccountPerCpf, (request, response) => {
    const {customer} = request;
    customers.splice(customer, 1)

    return response.status(200).json(customers)
})

app.get("/balance" , verifyExistyAccountPerCpf, (request, response) => {
const {customer} = request;
const balance = getBalance(customer.statement)
return response.json(balance)
})

app.listen(3333)