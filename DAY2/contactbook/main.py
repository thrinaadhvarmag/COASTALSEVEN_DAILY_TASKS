import json

FILE_NAME = "contacts.json"


# -----------------------------------
# Load contacts from JSON
# -----------------------------------

def load_contacts():

    try:

        with open(FILE_NAME, "r") as file:
            return json.load(file)

    except FileNotFoundError:

        return []

    except json.JSONDecodeError:

        print("Error: contacts.json contains invalid JSON.")
        return []


# -----------------------------------
# Save contacts to JSON
# -----------------------------------

def save_contacts(contacts):

    with open(FILE_NAME, "w") as file:

        json.dump(
            contacts,
            file,
            indent=4
        )


# -----------------------------------
# Add Contact
# -----------------------------------

def add_contact(contacts):

    name = input("Enter name: ")
    phone = input("Enter phone number: ")
    email = input("Enter email: ")

    contact = {
        "name": name,
        "phone": phone,
        "email": email
    }

    contacts.append(contact)

    save_contacts(contacts)

    print("Contact added successfully!")


# -----------------------------------
# View Contacts
# -----------------------------------

def view_contacts(contacts):

    if not contacts:

        print("No contacts found.")
        return

    print("\n---------- CONTACTS ----------")

    for index, contact in enumerate(contacts, start=1):

        print(f"\nContact {index}")
        print(f"Name  : {contact.get('name', 'N/A')}")
        print(f"Phone : {contact.get('phone', 'N/A')}")
        print(f"Email : {contact.get('email', 'N/A')}")


# -----------------------------------
# Search Contact
# -----------------------------------

def search_contact(contacts):

    name = input("Enter name to search: ").lower()

    found = False

    for contact in contacts:

        if contact.get("name", "").lower() == name:

            print("\nContact found!")

            print("Name :", contact.get("name"))
            print("Phone:", contact.get("phone"))
            print("Email:", contact.get("email"))

            found = True
            break

    if not found:

        print("Contact not found.")


# -----------------------------------
# Update Contact
# -----------------------------------

def update_contact(contacts):

    name = input("Enter name to update: ").lower()

    for contact in contacts:

        if contact.get("name", "").lower() == name:

            print("Leave field empty to keep old value.")

            new_name = input(
                f"New name [{contact.get('name')}]: "
            )

            new_phone = input(
                f"New phone [{contact.get('phone')}]: "
            )

            new_email = input(
                f"New email [{contact.get('email')}]: "
            )

            if new_name:
                contact["name"] = new_name

            if new_phone:
                contact["phone"] = new_phone

            if new_email:
                contact["email"] = new_email

            save_contacts(contacts)

            print("Contact updated successfully!")

            return

    print("Contact not found.")


# -----------------------------------
# Delete Contact
# -----------------------------------

def delete_contact(contacts):

    name = input("Enter name to delete: ").lower()

    for contact in contacts:

        if contact.get("name", "").lower() == name:

            contacts.remove(contact)

            save_contacts(contacts)

            print("Contact deleted successfully!")

            return

    print("Contact not found.")


# -----------------------------------
# Main Program
# -----------------------------------

def main():

    contacts = load_contacts()

    while True:

        print("\n============================")
        print("       CONTACT BOOK")
        print("============================")

        print("1. Add Contact")
        print("2. View Contacts")
        print("3. Search Contact")
        print("4. Update Contact")
        print("5. Delete Contact")
        print("6. Exit")

        choice = input("Enter your choice: ")

        if choice == "1":

            add_contact(contacts)

        elif choice == "2":

            view_contacts(contacts)

        elif choice == "3":

            search_contact(contacts)

        elif choice == "4":

            update_contact(contacts)

        elif choice == "5":

            delete_contact(contacts)

        elif choice == "6":

            print("Thank you for using Contact Book!")
            break

        else:

            print("Invalid choice. Please try again.")


if __name__ == "__main__":
    main()
