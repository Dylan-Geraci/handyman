"""Fix test user passwords with proper bcrypt hashes."""
from database import users_collection
import bcrypt

# Generate proper hash
hashed = bcrypt.hashpw('password123'.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
print(f"Generated hash: {hashed}\n")

# Update test users
result1 = users_collection.update_one(
    {'username': 'alice_builder'},
    {'$set': {'hashed_password': hashed}}
)

result2 = users_collection.update_one(
    {'username': 'bob_fixer'},
    {'$set': {'hashed_password': hashed}}
)

print(f"Updated alice_builder: {result1.modified_count} document(s)")
print(f"Updated bob_fixer: {result2.modified_count} document(s)")
print("\n[OK] Test users are ready!")
print("Username: alice_builder")
print("Password: password123")
