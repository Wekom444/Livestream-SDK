import json
from transformers import pipeline

recommendation_model = pipeline('text-classification', model="distilbert-base-cased")

def recommend_product(user_query, product_database):
    predictions = recommendation_model(user_query)
    top_product = max(product_database, key=lambda p: predictions[p['description']])
    return top_product

product_db = json.load(open("products.json"))
print(recommend_product("Best drinks for a Friday night", product_db))
