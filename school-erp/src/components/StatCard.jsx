import { memo } from 'react';
import { classNames } from '../utils/helpers';

const StatCard = ({ title, value, icon: Icon, trend, trendValue, color = 'bg-slate-600' }) => {
  return (
    <div className="card p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
          {trend && (
            <p className={classNames(
              'text-xs font-medium mt-2',
              trend === 'up' ? 'text-emerald-600' : 'text-red-500'
            )}>
              {trend === 'up' ? '↑' : '↓'} {trendValue}
            </p>
          )}
        </div>
        {Icon && (
          <div className={classNames('p-3 rounded-xl', color, 'bg-opacity-10')}>
            <Icon className={classNames('w-6 h-6', color.replace('bg-', 'text-'))} />
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(StatCard);
