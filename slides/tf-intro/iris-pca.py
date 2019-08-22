import pandas as pd
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA

df_raw = pd.read_csv('./iris-raw.csv')
x = df_raw.loc[:,['sepal.length','sepal.width','petal.length','petal.width']].values
y = df_raw.loc[:,['variety']].values

x = StandardScaler().fit_transform(x)
pc = PCA(n_components=2).fit_transform(x)
df_pc = pd.DataFrame(pc, columns=['pc.1', 'pc.2'])

df_all = pd.concat([df_pc, df_raw], axis=1)
df_all.to_csv('./iris-pc.csv', index=False)
