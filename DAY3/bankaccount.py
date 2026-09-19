class BankAccount:

    bank_name = "Python Bank"

    def __init__(self, account_number, owner, balance):
        self.account_number = account_number
        self.owner = owner
        self._balance = balance
        self.transactions = []

    @property
    def balance(self):
        return self._balance

    def deposit(self, amount):

        if amount <= 0:
            print("Invalid deposit amount")
            return

        self._balance += amount

        self.transactions.append(
            f"Deposited ${amount}"
        )

        print(f"${amount} deposited successfully")

    def withdraw(self, amount):

        if amount <= 0:
            print("Invalid withdrawal amount")
            return

        if amount > self._balance:
            print("Insufficient balance")
            return

        self._balance -= amount

        self.transactions.append(
            f"Withdrawn ${amount}"
        )

        print(f"${amount} withdrawn successfully")

    def show_balance(self):
        print(f"Current balance: ${self.balance}")

    def show_transactions(self):

        print(f"{type(self).__name__} Transaction History:")

        for transaction in self.transactions:
            print(transaction)

    def __str__(self):
        return (
            f"Account: {self.account_number}\n"
            f"Owner: {self.owner}\n"
            f"Balance: ${self.balance}"
        )
class SavingsAccount(BankAccount):

    def __init__(
        self,
        account_number,
        owner,
        balance,
        interest_rate
    ):
        super().__init__(
            account_number,
            owner,
            balance
        )

        self.interest_rate = interest_rate

    def add_interest(self):

        interest = self.balance * self.interest_rate / 100

        self._balance += interest

        self.transactions.append(
            f"Interest added ${interest}"
        )

        print(f"Interest added: ${interest}")
class CurrentAccount(BankAccount):

    minimum_balance = 5000

    def withdraw(self, amount):

        if self.balance - amount < self.minimum_balance:

            print(
                "Withdrawal denied: "
                "minimum balance required"
            )

            return

        super().withdraw(amount)
savings = SavingsAccount(
    "SAV001",
    "Thrinaadh",
    10000,
    5
)

current = CurrentAccount(
    "CUR001",
    "Rahul",
    20000
)
savings.deposit(5000)
savings.withdraw(2000)
current.deposit(4000)
current.withdraw(1000)
savings.add_interest()
savings.show_balance()
current.show_balance()
savings.withdraw(15000)
current.withdraw(17000)
print(savings)
print()
print(current)
savings.show_transactions()
current.show_transactions()
