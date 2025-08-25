export default function (data, { emit, save }) {
  const createDeepProxy = target => {
    return new Proxy(target, {
      get(target, key) {
        const value = target[key];
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          return createDeepProxy(value);
        }
        return value;
      },
      
      set(target, key, value) {
        const oldValue = target[key];
        if (JSON.stringify(oldValue) === JSON.stringify(value)) return true;

        target[key] = value;
        emit('config:change', key, value, oldValue);
        save(data);
        return true;
      },
      
      deleteProperty(target, key) {
        const value = target[key];
        if (Reflect.deleteProperty(target, key)) {
          emit('config:delete', key, value);
          save(data);
          return true;
        }
        return false;
      }
    });
  };

  return createDeepProxy(data);
}