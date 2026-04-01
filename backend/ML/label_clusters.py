import pandas as pd

# Load data
genome = pd.read_csv("../../datasets/crypto_genome_master.csv")
clusters = pd.read_csv("genome_clusters.csv")

# Merge
df = genome.merge(clusters, on="coin_symbol")

# Group by cluster
cluster_summary = df.groupby("cluster_id").mean(numeric_only=True)

print("\n--- CLUSTER SUMMARY ---")
print(cluster_summary)

# Save
cluster_summary.to_csv("cluster_summary.csv")

print("\nSaved: cluster_summary.csv")